# Proposal

## Why

Hoje o app só roda na máquina de quem desenvolve. A CI (`.github/workflows/ci.yml`) roda os testes, mas não gera nenhum artefato nem publica nada. O deploy na AWS do PR #1 (EC2 + Docker Compose + Caddy, criado com Terraform) foi fechado sem merge e dependia de rodar `deploy.sh` à mão, com as imagens construídas na própria instância. Para o app ficar acessível na web e cada feature chegar à produção só depois de passar por build e testes automáticos, o caminho do código até o servidor precisa ser um pipeline no GitHub Actions.

## What Changes

- **Imagens Docker** do backend e do frontend, uma por app. A imagem do frontend deixa de embutir a URL da API, então a mesma imagem passa no E2E e vai para produção.
- **Pipeline no GitHub Actions**, no lugar de `ci.yml`:
  - Em todo pull request: typecheck e testes unitários dos dois apps, build das duas imagens e E2E (Playwright) contra a stack montada com essas imagens. Nada é publicado.
  - Em push na `main`: tudo o que o PR faz e, só se tudo passar, push das imagens testadas no Amazon ECR e deploy na EC2.
- **Deploy sem chave de longa duração**: o Actions entra na AWS por OIDC, e o deploy chega à instância por SSM Run Command, então a porta 22 continua aberta só para o IP do operador. A instância puxa as imagens do ECR com o seu IAM role. Se um deploy falha, a versão anterior volta e o pipeline fica vermelho. Dois deploys nunca rodam ao mesmo tempo.
- **Ambiente de produção** numa EC2 com Docker Compose, retomando o PR #1 com ajustes: Postgres sem porta exposta e com volume persistente, e Caddy com HTTPS automático num único host (`kanban.<ip>.sslip.io`), que serve o app e encaminha `/api` para o backend. A instância continua `t4g.small` (ARM64, Graviton), e as imagens são construídas e testadas em runners ARM64 do GitHub, a mesma arquitetura da produção.
- **Acesso protegido por basic auth** no Caddy, com usuário e hash guardados no Parameter Store, até o app ter login. Só `GET /api/health` fica aberto, para a verificação pós-deploy. Isso substitui a regra "não publicar até ter login" registrada em `add-kanban-board`.
- **Frontend fala com a API na mesma origem**: o browser chama `/api` (proxy do Vite em dev, Caddy em produção), e o SSR chama o backend pela URL lida quando o servidor inicia (`API_URL`). **BREAKING** para o ambiente de dev: `VITE_API_URL` sai de `frontend/.env` e entra `API_URL`.
- **Branch `main`**: a `release` é renomeada para `main`, que continua sendo a branch padrão. Os PRs passam a mirar `main`.

Fora do escopo: login e autenticação no app, domínio próprio, backup do banco e alta disponibilidade (uma instância, com o banco no disco dela), ambientes de preview por PR, Terraform rodando no pipeline (a infra continua criada à mão com `terraform apply`) e servidor SSR de produção dedicado (continua `vite preview`, como no PR #1).

## Capabilities

### New Capabilities

- `delivery-pipeline`: como uma mudança chega à produção: verificações em PR e na `main` (build das imagens e testes), publicação das imagens testadas, deploy automático, rollback e deploys em fila.
- `production-environment`: o que roda em produção e como se chega a ele: HTTPS num único host, app e API na mesma origem, acesso protegido por basic auth, dados que sobrevivem aos deploys e migrações aplicadas na subida.

### Modified Capabilities

Nenhuma: `projects` e `kanban-board` não mudam de comportamento.

## Impact

- **frontend**: `src/config/env.ts` e `src/services/api.client.ts` (URL base por ambiente: `/api` no browser, `API_URL` no SSR), `vite.config.ts` (proxy de `/api` e `preview.allowedHosts`), `vitest.config.ts`, `src/test/fetch-stub.ts` e `.env.example`. Novos `Dockerfile` e `.dockerignore`.
- **backend**: novos `Dockerfile` e `.dockerignore`. O código não muda; o CORS continua configurado, mas o app deixa de depender dele.
- **raiz**: `.github/workflows/` (pipeline novo no lugar de `ci.yml`), `playwright.config.ts` e `e2e/support/` (modo que testa uma stack já de pé, com basic auth), um spec de fluxo novo para o acesso protegido, `.gitignore` (estado do Terraform) e `AGENTS.md` (mapa, comandos e a exceção à regra de CORS de `fullstack-folder-structure.md`).
- **`infra/`** (nova): Terraform (EC2, Elastic IP, security group, repositórios ECR, bucket S3 de releases, provedor OIDC do GitHub e roles IAM), compose de produção, Caddyfile, o script de release que roda na instância e o README de operação.
- **GitHub**: branch `main` padrão e variáveis do repositório com os ARNs e IDs que o pipeline usa. Nenhum secret de AWS.
- **AWS**: custo da EC2, do IP público, do ECR e do S3 (os dois últimos em centavos). Tudo criado e destruído com Terraform.
