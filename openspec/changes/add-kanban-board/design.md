# Design

## Context

- Os dois apps só têm o scaffold. O backend (Elysia 1.4 no Bun 1.4) tem um `src/index.ts` que responde "Hello Elysia", sem banco, sem módulo de ambiente e sem testes. O frontend é o starter do TanStack Start (`__root.tsx` e `index.tsx`), sem camada de dados e sem testes.
- As rules em `.agents/rules/` restringem o desenho: funções de até 30 linhas com objeto na entrada e na saída, ambiente validado num único módulo, logger pino, desligamento gracioso, timeout em toda chamada de saída, corpo de requisição limitado, testes ao lado do código com 80% de cobertura, E2E em `e2e/` na raiz, frontend sem importar nada do backend, dados do servidor via hooks sobre TanStack Query.
- Decisões já tomadas com o usuário: PostgreSQL, projetos separados, colunas fixas, login e deploy numa próxima change, interface em português. A motivação está em `proposal.md`; os requisitos, em `specs/`.

## Goals / Non-Goals

**Goals:**

- Modelo de dados e migrações que aceitem as próximas changes (login, deploy) só com migrações que acrescentam, sem refazer tabelas.
- Regra de movimentação como função pura, testada sem banco e sem HTTP.
- Banco de desenvolvimento e de testes de pé com um comando.

**Non-Goals:**

- Configuração de produção (imagem, banco gerenciado, CI).
- Colaboração em tempo real ou resolução de conflitos além de "a última escrita vence".
- Paginação de cards.

## Decisions

### D1. PostgreSQL 18, com Docker no desenvolvimento e nos testes

O projeto vai ser hospedado. PostgreSQL roda em qualquer hospedagem, tem oferta gerenciada com backup (Neon, Supabase, Railway, Render), aguenta várias instâncias do backend e o futuro uso por várias pessoas.

- **Alternativas**: SQLite (`bun:sqlite`), sem infraestrutura, mas preso a uma instância com disco persistente e com backup por conta própria; Turso (SQLite hospedado), que funciona em qualquer hospedagem mas prende a produção a um fornecedor menor e troca o cliente nativo do Bun por `@libsql/client`.
- **Local**: `backend/docker-compose.yml` com a imagem `postgres:18.7-alpine` (tag exata, nunca `latest`), volume nomeado, healthcheck e porta 5432. Um script de inicialização em `backend/docker/create-databases.sql` cria `kanban_test` e `kanban_e2e` ao lado de `kanban`.

### D2. Drizzle ORM sobre o cliente nativo `Bun.sql`

- O schema em TypeScript (`src/providers/drizzle/schema.ts`) é a fonte da verdade. `drizzle-kit generate` gera as migrações SQL em `backend/drizzle/`, que vão para o git e passam por revisão. `src/database/migrate.ts` aplica as migrações com `drizzle-orm/bun-sql/migrator` (`bun run db:migrate`), com o mesmo driver em desenvolvimento, nos testes e no futuro deploy.
- O driver `drizzle-orm/bun-sql` usa o cliente Postgres nativo do Bun, como pede o `bun-standards.md` (built-ins primeiro).
- **Alternativas**: Prisma (cliente gerado, passo extra de codegen e adapters de driver; a pasta `prisma/` no `fullstack-folder-structure.md` é exemplo de layout, não obrigação), Kysely (sem geração de migrações a partir do schema), `Bun.sql` puro (linhas sem tipo e migrações escritas à mão).
- **Saída de emergência**: se um bug do driver `bun-sql` travar o trabalho, trocar para `postgres` (postgres.js) com `drizzle-orm/postgres-js` muda só `src/providers/drizzle/drizzle.client.ts`.

### D3. Modelo de dados

| Tabela     | Coluna                     | Tipo                         | Regra                                                    |
| ---------- | -------------------------- | ---------------------------- | -------------------------------------------------------- |
| `projects` | `id`                       | `uuid` PK                    | `gen_random_uuid()`                                      |
|            | `name`                     | `text not null`              | índice único em `lower(name)`                            |
|            | `created_at`, `updated_at` | `timestamptz not null`       | `default now()`; `updated_at` atualizado pelo Drizzle    |
| `cards`    | `id`                       | `uuid` PK                    | `gen_random_uuid()`                                      |
|            | `project_id`               | `uuid not null`              | FK → `projects.id` `on delete cascade`                   |
|            | `stage`                    | enum `card_stage` `not null` | `backlog`, `explore`, `propose`, `apply`, `archive`      |
|            | `position`                 | `integer not null`           | 0 a n−1, sem lacunas, por (`project_id`, `stage`)        |
|            | `title`                    | `text not null`              |                                                          |
|            | `description`              | `text not null`              | `default ''`                                             |
|            | `created_at`, `updated_at` | `timestamptz not null`       | como em `projects`                                       |

Índice em `cards (project_id, stage, position)`.

- Os limites (80, 120 e 5.000 caracteres) ficam na validação HTTP, não em `varchar`: mudar um limite não exige migração.
- O índice único em `lower(name)` garante nome único sem diferenciar maiúsculas. A violação (código Postgres `23505`) vira `ConflictError` → 409.
- O `on delete cascade` cumpre "excluir projeto remove seus cards" numa única instrução.
- Próximas changes: o login acrescenta `users` e `projects.owner_id` (nulo e depois preenchido), sem refazer tabelas.

### D4. Colunas como enum fixo

O enum `card_stage` no banco e a constante `CARD_STAGE` (`as const`) no código definem as colunas: no backend em `src/domain/card/card.entity.ts` e no frontend em `src/types/card.ts`, já que os apps não compartilham código. Os rótulos seguem os comandos do OpenSpec (Backlog, Explore, Propose, Apply, Archive), como aprovado; o restante da interface fica em português.

- **Alternativa**: tabela `columns` por projeto, mais flexível, mas nenhum requisito pede colunas personalizáveis. Se vierem, uma migração troca o enum por chave estrangeira.

### D5. Ordenação: posições inteiras sem lacunas e função pura

- Cada card tem `position` de 0 a n−1 dentro do seu par (projeto, coluna).
- A função pura `planCardMove({ cards, cardId, toStage, toPosition })` recebe os cards das colunas de origem e destino e devolve as linhas a gravar (`{ id, stage, position }`). Ela tira o card da origem, limita `toPosition` ao tamanho do destino (posição além do fim vira fim), insere o card, renumera as duas colunas e devolve só as linhas que mudaram.
- O repositório move numa transação: `select ... from projects where id = $1 for update` serializa as escritas do projeto e resolve o 404 de projeto. Em seguida carrega o card (que precisa pertencer ao projeto) e as duas colunas, chama `planCardMove` e grava as linhas alteradas. Criar (posição = total do Backlog) e excluir (renumerar a coluna) usam a mesma trava.
- **Alternativas**: fractional indexing ou lexorank (uma escrita por movimento, mas chaves de texto que crescem e pedem rebalanceamento, complexidade que não se paga com dezenas de cards por coluna); posição em ponto flutuante pelo ponto médio (a precisão acaba depois de muitas inserções no mesmo lugar).
- O frontend aplica a mesma regra (cópia própria em `src/hooks/use-move-card/plan-card-move.ts`) na atualização otimista. As duas cópias são testadas com os mesmos cenários, e o servidor continua sendo a fonte da verdade: o cliente busca os cards de novo depois de cada mutação.

### D6. Contrato HTTP

| Método   | Caminho                                    | Corpo                     | Sucesso                                          |
| -------- | ------------------------------------------ | ------------------------- | ------------------------------------------------ |
| `GET`    | `/health`                                  | —                         | 200 `{ status: 'ok' }`                           |
| `GET`    | `/projects`                                | —                         | 200 `{ projects }` em ordem alfabética           |
| `POST`   | `/projects`                                | `{ name }`                | 201 `{ project }`                                |
| `GET`    | `/projects/:projectId`                     | —                         | 200 `{ project }`                                |
| `PATCH`  | `/projects/:projectId`                     | `{ name }`                | 200 `{ project }`                                |
| `DELETE` | `/projects/:projectId`                     | —                         | 204                                              |
| `GET`    | `/projects/:projectId/cards`               | —                         | 200 `{ cards }` por ordem de coluna e posição    |
| `POST`   | `/projects/:projectId/cards`               | `{ title, description? }` | 201 `{ card }`                                   |
| `PATCH`  | `/projects/:projectId/cards/:cardId`       | `{ title?, description? }`| 200 `{ card }`                                   |
| `DELETE` | `/projects/:projectId/cards/:cardId`       | —                         | 204                                              |
| `POST`   | `/projects/:projectId/cards/:cardId/move`  | `{ stage, position }`     | 200 `{ card }`                                   |

- **Formatos**: projeto `{ id, name, createdAt, updatedAt }`; card `{ id, projectId, stage, position, title, description, createdAt, updatedAt }`; datas em ISO 8601.
- **Erros**: `{ code, message }` (contrato da regra `fullstack-folder-structure`), com `VALIDATION_ERROR` 400, `PROJECT_NOT_FOUND`/`CARD_NOT_FOUND`/`NOT_FOUND` 404, `PROJECT_NAME_ALREADY_EXISTS` 409 e `INTERNAL_ERROR` 500 (mensagem genérica; o detalhe vai só para o log). Um único `onError` em `src/main/app.ts` chama `src/main/error-handler.ts`, que mapeia os erros de domínio (`src/domain/*/*.errors.ts`) e o `RequestValidationError` dos controllers. O frontend escolhe o texto pelo `code`.
- **Validação**: schemas zod 4 aplicados dentro de cada controller (`validateRequest`), não no Elysia. Os schemas removem os espaços das pontas antes de medir o tamanho. Assim os dois apps usam uma só biblioteca de validação, também usada no módulo de ambiente. A alternativa era o `t` (TypeBox) nativo do Elysia, mas o frontend precisaria de zod do mesmo jeito.
- **IDs malformados** (não UUID) respondem 404, como IDs inexistentes: nenhuma consulta chega ao Postgres com um valor que ele não converte.
- **Corpo limitado** a 1 MB (`maxRequestBodySize`), folgado para 5.000 caracteres de descrição.
- **Movimento** como ação própria (`POST .../move`): mover mexe em duas colunas ao mesmo tempo, e o `PATCH` fica só para o conteúdo do card.

### D7. Estrutura do backend

Segue `backend-folder-structure.md`: controller → use case → interface de repositório (domínio) → provider.

```
docker-compose.yml, docker/create-databases.sql   na raiz: Postgres 18 (kanban, kanban_test, kanban_e2e)
backend/
├── drizzle.config.ts              drizzle-kit: schema e pasta de saída
├── drizzle/                       migrações SQL geradas (versionadas)
├── .env.example / .env.test       DATABASE_URL, PORT, CORS_ORIGIN, LOG_LEVEL / kanban_test
└── src/
    ├── config/env.ts              valida o ambiente com zod
    ├── domain/{project,card}/     entidade, erros, interface do repositório; plan-card-move.ts (regra do movimento)
    ├── use-cases/<ação>/          uma pasta por ação (+ spec com repositório mockado)
    ├── providers/drizzle/         drizzle.client.ts, schema.ts, migrate.ts, projects/ e cards/ (repositórios + specs)
    ├── controllers/<ação>/        valida a requisição, chama o use case, devolve { statusCode, body } (+ spec)
    ├── main/                      server.ts (entrada), app.ts, routes.ts e routes/, error-handler.ts, logger.ts, shutdown.ts
    └── test/                      setup-database.ts (preload e resetDatabase()) e fixtures.ts
```

- A entrada passa a ser `src/main/server.ts` (o `src/index.ts` do scaffold foi removido); o script `dev`, o `module` e o `playwright.config.ts` apontam para ela.
- Os repositórios de cards lançam `ProjectNotFoundError` quando o projeto não existe, porque a checagem acontece dentro da transação com `FOR UPDATE`; `null` indica card ausente e o use case lança `CardNotFoundError`.
- Os testes HTTP ficam em `e2e/api/` (Playwright), um por rota; o backend só tem specs unitários e de repositório contra `kanban_test`.
- **Desligamento gracioso**: `SIGTERM`/`SIGINT` chamam `app.stop()` com prazo de 10 s e depois fecham o pool do `Bun.sql`. Um segundo sinal não faz nada.
- **CORS** com `@elysiajs/cors`, restrito a `CORS_ORIGIN`. A variável é obrigatória e sem valor padrão; o valor de desenvolvimento fica no `.env.example`. `PORT` mantém o padrão 3333 e `LOG_LEVEL` o padrão `info`.
- **Arquivos de ambiente**: `.env` continua fora do git. O `.env.test` entra no git com uma exceção `!.env.test` no `.gitignore` da raiz (que hoje ignora `.env.*`): ele só aponta para o Postgres local do Docker, com as mesmas credenciais não secretas do `docker-compose.yml`.

### D8. Frontend

- **Dados**: TanStack Query 5 integrada ao router com `@tanstack/react-router-ssr-query` (`setupRouterSsrQueryIntegration` em `getRouter`, rota raiz com contexto `{ queryClient }`). Os loaders das rotas chamam `ensureQueryData`, então o servidor já renderiza o quadro preenchido. As mutações usam `useMutation` em hooks `use-*.ts` e invalidam as queries afetadas.
- **Rotas**: `/` (projetos) e `/projects/$projectId` (quadro, com `notFoundComponent` "Projeto não encontrado" e link para `/`). Os arquivos de rota ficam finos; as telas moram em `src/views/` (cada uma com seus `components/`), a lógica em `src/hooks/` e o acesso à API em `src/services/`.
- **Cliente HTTP**: `src/services/api.client.ts` chama `fetch` com `AbortSignal.timeout` de 10 s, valida o corpo de sucesso com os schemas zod de `src/types/` e transforma o corpo de erro em `ApiError { status, code, message }`. `src/services/projects/projects.service.ts` e `src/services/cards/cards.service.ts` expõem uma função por endpoint. A URL base vem de `VITE_API_URL`, validada em `src/config/env.ts`.
- **Arrastar e soltar**: `@dnd-kit/core` + `@dnd-kit/sortable`, com um `SortableContext` por coluna, colunas vazias aceitando o card, `PointerSensor` com distância mínima de ativação (para o clique continuar abrindo o card), `TouchSensor`, `KeyboardSensor` e anúncios em português para leitores de tela. O `DndContext` recebe um `id` estável de `useId()` para não divergir na hidratação do SSR. Alternativas: `@dnd-kit/react` (API nova, ainda 0.x) e `@atlaskit/pragmatic-drag-and-drop` (drag nativo do HTML5, sem arrastar pelo teclado nem animação de reordenação pronta).
- **"Mover para"**: botão de abrir e fechar (`aria-expanded`) em cada card, com as outras quatro colunas como botões. Um `<select>` ficou de fora porque, em alguns navegadores, trocar o valor com as setas dispararia movimentos enquanto o usuário só navega.
- **Movimento otimista**: `useMoveCard` cancela a query de cards, aplica `planCardMove` no cache, desfaz em caso de erro e mostra a mensagem em `role="alert"`, e busca os cards de novo ao terminar. O arrastar e o "Mover para" usam o mesmo hook.
- **Diálogos**: `<dialog>` nativo para criar e editar card e para as confirmações de exclusão, sem biblioteca de UI.
- **Visual**: Tailwind. `__root.tsx` passa a usar `lang="pt-BR"` e o título "Kanban", e o conteúdo do starter sai.

### D9. Testes

- **Backend (`bun test`)**: testes unitários para as funções puras (`planCardMove`, ambiente, tradução de erros) e testes de integração para repositórios e rotas, contra o `kanban_test`. As rotas são chamadas com `app.handle(new Request(...))`, sem abrir porta. O preload aplica as migrações uma vez e falha com uma mensagem clara (citando `docker compose up -d`) se o Postgres estiver fora do ar. Cada spec de integração chama `resetDatabase()` (`truncate ... cascade`) no `beforeEach`. No `bunfig.toml`, `[test]` define `root = "src"`, cobertura ligada, limite de 0.8, `coverageSkipTestFiles`, `restoreMocks` e o preload.
- **Frontend (Vitest 5 + jsdom + Testing Library + user-event + jest-dom)**: `vitest.config.ts` separado do `vite.config.ts`, porque o plugin do TanStack Start não é necessário nos testes; cobertura v8 com limite de 80%. Os componentes são testados por papel, rótulo e texto, com `fetch` substituído por `vi.stubGlobal` (sem MSW) e um helper `renderWithProviders` que monta `QueryClient` e um router em memória. O jsdom não simula bem o arrastar; esse caminho fica com o E2E.
- **E2E (Playwright, na raiz)**: `playwright.config.ts` sobe o backend na porta 3334 com o `kanban_e2e` (migrações antes de iniciar) e o frontend na 3001 apontando para ele, sem colidir com os servidores de desenvolvimento em 3333 e 3000. Cada spec cria seu próprio projeto com nome único, o que deixa os testes independentes sem limpeza. Specs: `e2e/manage-projects.e2e-spec.ts` e `e2e/move-card.e2e-spec.ts`.

### D10. Dependências

Todas entram com `bun add` (versão exata, já garantida por `exact = true`). Antes da primeira instalação, o `bunfig.toml` de cada app recebe `minimumReleaseAge = 259200` (3 dias), como pede o `bun-standards.md`. A raiz ganha um `bunfig.toml` próprio para o Playwright.

## Risks / Trade-offs

- [O driver `bun-sql` do Drizzle é mais novo que o `postgres-js`] → isolado em `src/providers/drizzle/drizzle.client.ts`; trocar para `postgres` muda um arquivo.
- [`@dnd-kit/core` sem lançamentos desde dezembro de 2024] → é estável, muito usado e funciona com React 19. O arrastar fica confinado em `src/hooks/use-board-dnd/` e `src/views/board/`, e o "Mover para" não depende dele. Migrar para `@dnd-kit/react` quando chegar à 1.0.
- [IDs do dnd-kit divergindo na hidratação do SSR] → `id` estável via `useId()` no `DndContext`.
- [Duas abas editando o mesmo quadro] → a trava na linha do projeto mantém as posições consistentes, a última escrita vence e a TanStack Query busca os dados de novo quando a janela volta ao foco.
- [Regra de movimento duplicada nos dois apps] → mesmos cenários testados nos dois lados; o servidor é a fonte da verdade e o cliente busca de novo após cada mutação.
- [Testes do backend e E2E exigem Docker] → `docker compose up -d` documentado no `AGENTS.md`; o preload falha cedo com uma mensagem que cita o comando.
- [App sem login] → não publicar antes da change de login; CORS restrito a `CORS_ORIGIN`.
- [Lista de cards por projeto sem limite] → suficiente para uso pessoal (dezenas de cards); paginação quando fizer falta.

## Migration Plan

Projeto novo, sem dados a migrar. Para rodar localmente: `docker compose up -d` em `backend/`, `bun run db:migrate` e os dois servidores de desenvolvimento. Para desfazer: reverter o commit e rodar `docker compose down -v`. Onde as migrações rodam em produção e qual banco gerenciado usar fica para a change de deploy.

## Open Questions

- Em produção, o SSR do frontend pode precisar falar com o backend por uma URL interna diferente da pública (`VITE_API_URL`). Não afeta esta change, que roda só localmente; decidir na change de deploy.
