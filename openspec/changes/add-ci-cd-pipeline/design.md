# Design

## Context

- **CI atual**: `.github/workflows/ci.yml` roda em push para `main` e `release` e em todo pull request. Tem dois jobs: `unit` (typecheck e testes dos dois apps, com Postgres como service) e `e2e` (o Playwright sobe os dev servers pelo `webServer`). As actions estão por tag de major (`@v4`, `@v2`) e o `setup-bun` não fixa a versão do Bun.
- **PR #1** (branch `infra/aws-ec2-deploy`, fechado sem merge) já tem o ponto de partida: Dockerfiles dos dois apps (`oven/bun:1.4.4-alpine`, usuário sem root, o backend aplica as migrações antes de subir), `infra/docker-compose.prod.yml` (Postgres, backend, frontend em `vite preview`, Caddy `2.10.2`), Terraform (EC2 `t4g.small` arm64, Elastic IP, security group, key pair, user-data que instala o Docker) e um `deploy.sh` que faz rsync do repositório e constrói as imagens na instância.
- **Frontend**: o Vite embute `VITE_API_URL` no build. `src/config/env.ts` valida essa variável quando o módulo carrega, e `src/services/api.client.ts` prefixa com ela toda requisição, tanto no SSR quanto no browser. O Vitest roda sem o compilador do TanStack Start, define `VITE_API_URL=http://api.test`, e os specs comparam URLs com esse prefixo.
- **Backend**: responde `GET /health` e exige `CORS_ORIGIN` no ambiente. As migrações rodam por `src/providers/drizzle/migrate.ts`.
- **Repositório**: público (era privado quando a change foi escrita), com `release` como branch padrão e sem `main`. Os logs do Actions ficam visíveis para qualquer pessoa.
- **Decisões tomadas com o usuário**: EC2 com OIDC, SSM e ECR; `main` como branch padrão; API na mesma origem, com a URL do SSR lida em runtime; basic auth no Caddy. A motivação está em `proposal.md`; os requisitos, em `specs/`.

## Goals / Non-Goals

**Goals:**

- Uma imagem por app e por commit: a que passa no E2E é a mesma, com o mesmo ID, que vai para o ECR e para a produção.
- Nenhuma credencial de longa duração: o GitHub não guarda chave da AWS, e a instância não guarda token de registry.
- O script de release, inclusive o rollback, roda na CI em todo pull request, não só na produção.
- O ambiente de dev muda só no nome de uma variável do frontend.

**Non-Goals:**

- Imagens multi-arquitetura.
- Deploy sem indisponibilidade: o Compose recria os containers, e cada deploy tem alguns segundos de 502.
- Terraform no pipeline e estado remoto do Terraform.

## Decisions

### D1. Um workflow, com jobs encadeados

`.github/workflows/pipeline.yml` substitui `ci.yml`. Ele dispara em `pull_request` (qualquer branch de destino) e em `push` na `main`.

| Job             | Roda em                | Depende de                                    | Faz                                                                                     |
| --------------- | ---------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `backend`       | PR e `main`            | —                                             | `bun ci`, `bun check`, `bun test`, com Postgres como service                            |
| `frontend`      | PR e `main`            | —                                             | `bun ci`, `bun check`, `bun run test`                                                   |
| `infra`         | PR e `main`            | —                                             | `terraform fmt -check`, `terraform validate` e `shellcheck` dos scripts de release      |
| `images`        | PR e `main`            | —                                             | build das duas imagens (Buildx, cache do GitHub Actions), `docker save` → artifact     |
| `e2e`           | PR e `main`            | `images`                                      | carrega as imagens, sobe a stack com o script de release (D8) e roda o Playwright      |
| `release-drill` | PR e `main`            | `images`                                      | roda `apply-release.spec.sh`: release boa, release quebrada, rollback                  |
| `publish`       | push na `main` com deploy ligado | `backend`, `frontend`, `infra`, `e2e`, `release-drill` | OIDC, `docker load` e push no ECR das tags que ainda não existem              |
| `deploy`        | push na `main` com deploy ligado | `publish`                           | envia o bundle ao S3, dispara o SSM, espera o resultado e faz a verificação pública    |
| `deploy-skipped`| push na `main` com deploy desligado | as mesmas do `publish`           | escreve no resumo da execução que a publicação e o deploy foram pulados                |

- `images`, `e2e` e `release-drill` rodam no runner `ubuntu-24.04-arm`, porque constroem ou executam as imagens (D7). Os demais rodam em `ubuntu-latest`, inclusive o `publish`, que só carrega e envia as imagens sem executá-las.
- O deploy está ligado quando a variável do repositório `DEPLOY_ENABLED` vale `true`. Assim, destruir a infra não deixa a `main` vermelha.
- O workflow inteiro tem `permissions: contents: read`. Só `publish` e `deploy` ganham `id-token: write`, e os dois só rodam em push na `main`, então um pull request nunca obtém credencial da AWS.
- **Alternativas**: dois workflows ligados por `workflow_run` (perdem o `needs` direto e complicam a troca de artifacts entre execuções); reconstruir as imagens no `publish` (o resultado não é garantidamente a imagem testada).

### D2. Versões fixas em tudo

- Actions fixadas pelo SHA completo do commit, com a versão em comentário (`actions/checkout@<sha> # v4.x.y`). Uma tag pode ser movida; um SHA, não.
- `oven-sh/setup-bun` com `bun-version: 1.4.4`, a mesma versão da imagem `oven/bun:1.4.4-alpine` e de `@types/bun`.
- Imagens de terceiros com tag exata: `postgres:18.7-alpine`, `caddy:2.10.2-alpine` e uma `busybox` fixada para o drill (D8). O provider `hashicorp/aws` continua em `6.14.0`, e o `setup-terraform` também recebe uma versão exata.
- As versões exatas de cada action e imagem são escolhidas na implementação, respeitando o mesmo critério do `minimumReleaseAge` (publicadas há pelo menos três dias).

### D3. Imagens

- Os Dockerfiles do PR #1 são a base. O do backend não muda. O do frontend perde o `ARG VITE_API_URL`: o build não depende de ambiente, e a URL da API entra quando o container inicia (D4).
- Plataforma única `linux/arm64` (D7).
- Na CI, as imagens recebem as tags locais `kanban-backend:<sha>` e `kanban-frontend:<sha>`. No ECR, a tag é o SHA completo do commit.
- **Passagem entre jobs**: `images` grava cada imagem com `docker save` num artifact com retenção de 1 dia. `e2e`, `release-drill` e `publish` fazem `docker load` desse mesmo arquivo, então o ID da imagem é o mesmo nos três. O `publish` escreve esses IDs no resumo da execução, para rastrear o que foi implantado.
- **Healthchecks** ficam no compose, não no Dockerfile: no backend, `wget -qO- http://127.0.0.1:3333/health`; no frontend, `wget -qO /dev/null http://127.0.0.1:3000/` (o BusyBox do Alpine traz o `wget`). O do frontend também exercita o SSR chamando o backend.

### D4. Frontend na mesma origem, com a URL do SSR lida em runtime

- `src/config/env.ts` passa a exportar:
  - `parseServerEnv({ source })`, que valida `API_URL` (URL absoluta) com zod;
  - `getApiBaseUrl`, criada com `createIsomorphicFn()`: no servidor, devolve `API_URL` lido de `process.env`; no browser, devolve a constante `BROWSER_API_BASE_PATH = '/api'`.

  O módulo deixa de validar no carregamento, porque essa validação iria parar no bundle do browser.
- `api.client.ts` monta a URL com `getApiBaseUrl()` no lugar de `env.VITE_API_URL`.
- `vite.config.ts` vira uma função de `{ command }`. Quando `command === 'serve'` (vale para `vite dev` e para `vite preview`), ele lê `API_URL` com `loadEnv`, valida com `parseServerEnv` e configura `server.proxy['/api']` para `API_URL`, tirando o prefixo `/api`; o `vite preview` herda esse proxy. No `vite build`, nada disso roda, então o build não precisa de `API_URL`. Sem `API_URL`, dev e preview falham na subida. `preview.allowedHosts: true` vem do PR #1, porque só o Caddy chega ao preview.
- **Testes**: sem o compilador do Start, `createIsomorphicFn` executa o ramo `.server` (o fallback de `@tanstack/start-fn-stubs` instalado confirma isso). Por isso o `vitest.config.ts` troca `VITE_API_URL` por `API_URL: 'http://api.test'`, e os specs que comparam `http://api.test/...` continuam valendo. O ramo `.client` é uma constante e fica coberto pelos fluxos E2E.
- **Exceção a uma regra**: `fullstack-folder-structure.md` §3 diz que o frontend chama o backend direto em `VITE_API_URL`, com CORS. Esta change troca isso por `/api` na mesma origem, e o `AGENTS.md` registra a exceção e o motivo: uma imagem só para todos os ambientes, e basic auth funcionando. O backend mantém o CORS (`CORS_ORIGIN` igual à origem do app), que fica sem uso, mas inofensivo.
- **Alternativas**: build por ambiente (a imagem publicada não é a testada); injetar uma URL absoluta da API no HTML em runtime e manter dois hosts com CORS (o browser não manda basic auth em chamadas cross-origin); passar cada chamada por server functions do Start (mais código e um salto a mais em toda requisição).

### D5. Borda: Caddy com um host, `/api` e basic auth

```
{$APP_SITE} {
	encode zstd gzip

	@protected not path /api/health
	basic_auth @protected {
		{$BASIC_AUTH_USER} {$BASIC_AUTH_HASH}
	}

	handle_path /api/* {
		reverse_proxy backend:3333
	}

	handle {
		reverse_proxy frontend:3000
	}
}
```

- `APP_SITE` vale `kanban.<ip-com-hífens>.sslip.io` em produção (HTTPS automático, com redirecionamento de HTTP para HTTPS) e `:80` na CI (só HTTP).
- **Credenciais**: um usuário e um hash bcrypt.
  - Em produção, ficam no Parameter Store como `SecureString`, em `/kanban/basic-auth/user` e `/kanban/basic-auth/hash`. O operador cria os dois com `caddy hash-password`, e a instância lê os valores a cada deploy.
  - Na CI, o job gera uma senha aleatória e o hash a cada execução, com a mesma imagem do Caddy. Nenhuma credencial vai para o git.
- O hash tem `$`. O script de release grava os valores no arquivo de ambiente sem passar por interpolação do Compose, e o drill na CI pega qualquer erro nesse caminho, porque usa o mesmo script.

### D6. E2E contra as imagens

- `e2e/support/env.ts` ganha `E2E_TARGET`, com os valores `local` (padrão) e `stack`:
  - `local`: igual a hoje. O Playwright sobe backend e frontend, e o frontend recebe `API_URL` no lugar de `VITE_API_URL`. Exige `E2E_DATABASE_URL`.
  - `stack`: o Playwright não sobe nada e testa a stack que já está de pé. Exige `E2E_BASIC_AUTH_USER` e `E2E_BASIC_AUTH_PASSWORD`, que viram `httpCredentials` do projeto `flows`.
- As URLs não mudam. Na CI, o Caddy publica a porta 3001 (os fluxos passam pela borda, com basic auth), e `infra/docker-compose.e2e.yml` publica o backend na 3334. O projeto `api` e os fixtures continuam falando direto com o backend, como hoje.
- Na CI, a stack sobe pelo mesmo `apply-release.sh` da produção (D8), com as imagens locais, o override do E2E e um diretório de estado temporário. O Postgres é do próprio compose e nasce vazio a cada execução.
- Novo spec `e2e/flows/access-protection.e2e-spec.ts`, que só roda em `stack` (no modo `local` não existe borda): sem credenciais, `/` e `/api/projects` respondem 401; `/api/health` responde 200; com credenciais, a lista de projetos aparece.
- Se o E2E falha, o job publica o relatório do Playwright e os logs do compose como artifact.

### D7. Instância ARM64 (Graviton) e runners ARM64

`t4g.small` com a AMI arm64 do Ubuntu 24.04, como no PR #1. Entre as opções de 64 bits com 2 vCPUs e 2 GB, é a mais barata: cerca de US$ 1,50 por mês a menos que a `t3a.small` (x86-64), on-demand em us-east-1. Os jobs que constroem ou executam as imagens usam o runner `ubuntu-24.04-arm`, gratuito em repositório público (2 CPUs, 8 GB). Assim a imagem roda nativamente nos testes e é a mesma que sobe na instância.

- A arquitetura da AMI é derivada do `instance_type` (`data.aws_ec2_instance_type`), então o tipo da instância é a única variável do Terraform que define a arquitetura.
- **Fallback**: se o repositório recusar o rótulo `ubuntu-24.04-arm`, ou se os minutos ARM pesarem na franquia do plano, usar `t3a.small` (x86-64), `runs-on: ubuntu-latest` nos três jobs e a plataforma `linux/amd64`. A decisão precisa vir antes do primeiro `terraform apply`: o Terraform ignora mudanças de AMI, então trocar de arquitetura depois recria a instância e apaga o banco.
- **Alternativas**: `t3a.small` com os runners x86-64 padrão (a opção do fallback, mais cara); emulação com QEMU num runner x86-64 (build lento, e o E2E rodaria numa CPU emulada); imagens multi-arquitetura testadas em x86-64 e implantadas em ARM64 (a imagem implantada não seria a testada).

### D8. Release: script na instância, bundle no S3, comando pelo SSM

`infra/release/` é o bundle que vai para a instância a cada deploy:

| Arquivo                 | Papel                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`    | Postgres, backend, frontend e Caddy. Imagens e portas vêm de variáveis. Nome de projeto fixo (`kanban`), para os volumes sobreviverem entre releases |
| `Caddyfile`             | D5                                                                                                      |
| `apply-release.sh`      | Aplica uma release sem falar com a AWS. Também roda na CI                                                |
| `run-release.sh`        | Só na instância: login no ECR com o role da instância, leitura do Parameter Store, chamada de `apply-release.sh` |
| `apply-release.spec.sh` | O drill, que roda só na CI                                                                              |

`apply-release.sh` recebe tudo por variável de ambiente: `RELEASE_ID`, `BACKEND_IMAGE`, `FRONTEND_IMAGE`, `APP_SITE`, `APP_URL`, `BASIC_AUTH_USER`, `BASIC_AUTH_HASH`, `STATE_DIR` e, opcionalmente, portas e um compose de override. Ele:

1. Na primeira execução, gera `POSTGRES_PASSWORD` em `STATE_DIR/.env`, com modo 600.
2. Roda `docker compose up -d --wait --wait-timeout 180 --remove-orphans` com o compose da release.
3. Se der certo, grava a release em `STATE_DIR/current-release` (imagens e diretório do bundle), remove imagens sem uso e mantém só os cinco últimos bundles.
4. Se falhar, mostra `docker compose ps` e os logs do serviço que não ficou saudável, sobe de novo a release registrada em `current-release` (se houver uma) e sai com código 1.

O job `deploy`:

1. `aws s3 cp --recursive infra/release s3://$RELEASES_BUCKET/releases/$SHA/`
2. `aws ssm send-command --document-name AWS-RunShellScript`, com o comando que baixa o bundle para `/opt/kanban/releases/$SHA/` e roda `run-release.sh`, e `--timeout-seconds 600`.
3. Consulta `get-command-invocation` a cada 5 segundos até um estado final (no máximo 10 minutos), imprime stdout e stderr e falha se o estado não for `Success`.
4. Verificação pública: `GET https://$APP_DOMAIN/api/health` deve responder 200, com novas tentativas por até 2 minutos, porque o Caddy pode estar emitindo o certificado no primeiro deploy. `GET https://$APP_DOMAIN/` sem credenciais deve responder 401.

O drill (`release-drill`) usa as imagens do commit:

1. Aplica a release A, com as imagens boas, e cria um projeto pela API.
2. Aplica a release B, com `BACKEND_IMAGE` trocada pela `busybox`, que sai na hora e nunca fica saudável.
3. Confere que o script saiu com erro, que `current-release` ainda aponta para A, que `/api/health` responde 200 e que o projeto criado continua lá.

**Rollback manual**: reexecutar o job `deploy` de uma execução anterior da `main`. A reexecução usa o SHA daquela execução, e as imagens dela ainda estão no ECR (D9 guarda as dez últimas).

**Alternativas**: mandar os arquivos dentro do próprio comando do SSM (a AWS não documenta o limite de tamanho dos parâmetros do `SendCommand`); SSH com rsync, como o `deploy.sh` (exige a porta 22 aberta para os runners); clonar o repositório na instância (exige uma deploy key guardada lá).

### D9. AWS com Terraform

O ponto de partida é `infra/terraform/` do PR #1, com estes recursos novos ou alterados:

| Recurso                                                        | Para quê                                                                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `aws_instance` `t4g.small` + Elastic IP + security group       | Igual ao PR #1 (ARM64, D7), com a arquitetura da AMI derivada do tipo da instância. Portas 80 e 443 abertas, 22 só do CIDR do operador. Ganha um instance profile |
| Role e instance profile da EC2                                 | `AmazonSSMManagedInstanceCore`, pull nos dois repositórios ECR, `s3:GetObject` em `releases/*` e `ssm:GetParameter` em `/kanban/*` |
| `aws_ecr_repository` × 2 (`kanban-backend`, `kanban-frontend`) | Tags imutáveis, scan no push e lifecycle que guarda as dez últimas imagens                                  |
| Bucket S3 de releases                                          | Bloqueio de acesso público, criptografia SSE-S3 e expiração de `releases/` em 30 dias                      |
| `aws_iam_openid_connect_provider` do GitHub                    | Um por conta AWS. Se a conta já tiver um, o README explica como importá-lo                                  |
| Role `kanban-github-publish`                                   | Confia só em `aud = sts.amazonaws.com` e `sub = repo:<owner>/<repo>:ref:refs/heads/main`. Pode fazer push e `DescribeImages` nos dois repositórios e `GetAuthorizationToken` |
| Role `kanban-github-deploy`                                    | Confia só em `aud = sts.amazonaws.com` e `sub = repo:<owner>/<repo>:environment:production`. Pode fazer `s3:PutObject` em `releases/*`, `ssm:SendCommand` na instância e no documento `AWS-RunShellScript`, e `ssm:GetCommandInvocation` |
| `user-data.sh`                                                 | Docker e o plugin Compose v2 (pacotes do Ubuntu) e AWS CLI v2. O agente do SSM já vem na AMI do Ubuntu. A swap do PR #1 sai, porque a instância não constrói mais imagens |

- As saídas do Terraform viram variáveis do repositório no GitHub: `AWS_REGION`, `AWS_PUBLISH_ROLE_ARN`, `AWS_DEPLOY_ROLE_ARN`, `ECR_REGISTRY`, `RELEASES_BUCKET` e `INSTANCE_ID`, além de `DEPLOY_ENABLED`, definida à mão. São identificadores, não segredos, e o README traz os comandos `gh variable set`. A exceção é `APP_DOMAIN`, gravado como secret do repositório (`gh secret set`): o domínio contém o IP, os logs são públicos e o GitHub só mascara secrets. Uma variável mascarada com `::add-mask::` ainda apareceria no cabeçalho de `env` do passo que registra a máscara.
- O estado do Terraform continua local e fora do git, como no PR #1. `.terraform.lock.hcl` vai para o git.
- **Environment `production` e proteção da `main`**: em repositório público, os dois são gratuitos. O job `deploy` roda no environment `production`, que pede aprovação antes de começar e só aceita branches protegidas; a `main` exige os checks do pipeline antes do merge. O acesso à AWS fica em dois roles: `publish` confia na `main`, e `deploy` só no environment, então só um job aprovado alcança o S3 e o SSM. Um role só, com os dois jobs no environment, pediria duas aprovações por execução; juntar `publish` e `deploy` num job quebraria o rollback manual, porque reexecutar uma execução antiga exigiria os artifacts das imagens, que expiram em 1 dia.

### D10. Concorrência

No nível do workflow:

```yaml
concurrency:
  group: ${{ github.event_name == 'push' && 'pipeline-main' || format('pipeline-{0}', github.ref) }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

Na `main`, as execuções rodam uma de cada vez, e o GitHub mantém na fila só a mais recente. Isso cumpre "Deploys em fila" sem nunca implantar um commit mais antigo depois de um mais novo. Em pull request, um push novo cancela a execução anterior do mesmo PR.

- **Alternativa**: concorrência só no job `deploy` (um commit mais antigo cujos testes terminassem depois poderia sobrescrever um mais novo).

### D11. Branch `main`

A `release` é renomeada para `main` pela API do GitHub (`gh api -X POST repos/<owner>/<repo>/branches/release/rename -f new_name=main`). Como ela é a branch padrão, a `main` herda esse papel. O GitHub redireciona os links antigos e passa os PRs abertos para a `main`. O histórico não muda e não sobra uma `release` sem uso. Os clones locais acompanham com `git branch -m release main`, `git fetch origin --prune` e `git branch -u origin/main main`. Esta change é o primeiro PR para `main`, então o próprio pipeline é exercitado no PR.

- **Alternativa**: criar `main` a partir da `release` e manter as duas (mesmo conteúdo em duas branches, com a `release` abandonada).

## Risks / Trade-offs

- [Rollback contra um schema já migrado] Se a versão nova aplicou uma migração e caiu depois, a anterior sobe contra o schema novo. → Migrações só acrescentam (colunas anuláveis, tabelas novas), e remoções vão numa change seguinte. A regra fica escrita no `AGENTS.md` e no `infra/README.md`.
- [`vite preview` como servidor SSR de produção] Não foi feito para produção. → Limite aceito e registrado. Um servidor Bun dedicado fica para outra change.
- [Banco no disco de uma única instância, sem backup] `terraform destroy` ou a perda do disco apagam os dados. → Documentado. O ambiente é de estudo, e a proteção de acesso evita dados de terceiros.
- [Indisponibilidade curta a cada deploy] Recriar os containers derruba o app por alguns segundos. → Aceito (Non-Goals).
- [Limite de emissão do Let's Encrypt em `sslip.io`] → O Caddy guarda os certificados no volume `caddy-data`, que sobrevive aos deploys. Se o limite for atingido, a saída é a CA de staging, documentada no README.
- [Artifacts das imagens pesam algumas centenas de MB por execução] → Retenção de 1 dia e compressão.
- [Runner ARM64 recusado no repositório, ou minutos ARM pesando na franquia do plano] → Conferido na primeira execução do PR (tarefa 7.3), antes do `terraform apply`. Se falhar, aplica-se o fallback de D7.
- [Trocar de arquitetura depois do primeiro deploy recria a instância e apaga o banco] → A arquitetura é decidida no PR, antes de existir uma instância com dados.
- [`$` do hash bcrypt interpolado por engano] → O script grava o valor sem interpolação, e o drill na CI exercita o caminho real.
- [Trust do OIDC amplo demais] → `sub` restrito à `main` deste repositório, permissões só nos recursos do projeto e nenhuma credencial guardada no GitHub.
- [`docker compose up --wait` numa versão antiga do Compose] → O Ubuntu 24.04 traz Compose v2 com `--wait` e `--wait-timeout`. A versão é conferida na primeira subida, e o README a registra.
- [`process.env` substituído no build do SSR] Se o Vite trocar a leitura por um valor fixo, a imagem perde a configuração em runtime. → O E2E em modo `stack` sobe a imagem com uma `API_URL` diferente da de dev e falha se isso acontecer.
- [Logs públicos] → `APP_DOMAIN` é secret, mascarado pelo GitHub. Os outros valores são identificadores sem poder sozinhos, e PRs vindos de forks não recebem secrets nem token OIDC.

## Migration Plan

1. Renomear a `release` para `main` e abrir esta change num PR para `main`, com `DEPLOY_ENABLED` ainda indefinida.
2. No PR, o pipeline roda as verificações. `publish` e `deploy` não aparecem, porque o evento é `pull_request`.
3. Fazer o merge. A `main` roda as verificações e o `deploy-skipped` registra que o deploy foi pulado.
4. O operador roda `terraform apply`, cria os dois parâmetros do basic auth, grava as variáveis do repositório e define `DEPLOY_ENABLED=true`.
5. Reexecutar o pipeline da `main` (ou fazer um push novo) para o primeiro deploy, e conferir a verificação pública e o app no navegador.

**Rollback**: reexecutar o `deploy` de uma execução anterior. Para parar os deploys, `DEPLOY_ENABLED=false`. Para desmontar tudo, `terraform destroy`, que apaga também os dados. Para desfazer esta change, reverter o merge: o `ci.yml` volta, e a infra continua até o `destroy`.

## Open Questions

- O formato de hash que o `basic_auth` do Caddy 2.10 aceita (bcrypt puro ou em base64) é conferido na implementação, pelo drill. A resposta não muda a abordagem.
