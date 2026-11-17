# Tasks

## 1. Infraestrutura do banco e dependências do backend

- [x] 1.1 Adicionar `minimumReleaseAge = 259200` em `[install]` no `backend/bunfig.toml` e no `frontend/bunfig.toml`; verificar que `bun install` continua passando nos dois apps.
- [x] 1.2 Criar `backend/docker-compose.yml` (imagem `postgres:18.7-alpine`, volume nomeado, healthcheck, porta 5432, banco `kanban`) e `backend/docker/create-databases.sql` (cria `kanban_test` e `kanban_e2e`); verificar com `docker compose up -d` e `docker compose exec postgres psql -U kanban -l` listando os três bancos.
- [x] 1.3 Criar `backend/.env.example` (`DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `LOG_LEVEL`) e `backend/.env.test` (URL do `kanban_test`), e acrescentar `!.env.test` ao `.gitignore` da raiz; verificar que `git check-ignore -v backend/.env` confirma o `.env` ignorado e que `git status` lista `.env.example` e `.env.test`.
- [x] 1.4 Adicionar `drizzle-orm`, `zod`, `pino` e `@elysiajs/cors`, e `drizzle-kit` como dev, com `bun add`; verificar versões exatas no `backend/package.json` e o `bun.lock` atualizado.

## 2. Base do backend

- [x] 2.1 Configurar `[test]` no `backend/bunfig.toml` (`root = "src"`, `coverage = true`, `coverageThreshold = 0.8`, `coverageSkipTestFiles = true`, `restoreMocks = true`); verificar que `bun test` roda o primeiro spec da tarefa 2.2.
- [x] 2.2 Criar `src/config/env.ts` com zod (`DATABASE_URL` e `CORS_ORIGIN` obrigatórios, `PORT` padrão 3333, `LOG_LEVEL` padrão `info`) e expor `parseEnv({ source })` para teste; verificar com `src/config/env.spec.ts` cobrindo variável obrigatória ausente, URL inválida e valores padrão.
- [x] 2.3 Criar `src/main/logger.ts` (pino com `LOG_LEVEL` e `redact` de headers sensíveis); verificar com `bun check`.
- [x] 2.4 Criar `src/shared/errors.ts` (`NotFoundError`, `ConflictError`) e `src/main/error-handler.ts`, que converte erros em `{ error: { code, message } }` (`VALIDATION_ERROR` 400, `NOT_FOUND` 404, `CONFLICT` 409, `INTERNAL_ERROR` 500 com o detalhe só no log); verificar com `src/main/error-handler.spec.ts` cobrindo cada código.

## 3. Banco de dados e migrações

- [x] 3.1 Criar `src/database/schema.ts` (enum `card_stage`, tabelas `projects` e `cards`, índice único em `lower(name)`, FK com `on delete cascade`, índice `(project_id, stage, position)`, `updated_at` com `$onUpdate`) e `drizzle.config.ts`, com os scripts `db:generate` e `db:migrate`; rodar `bun run db:generate` e verificar que a migração em `backend/drizzle/` contém o `CREATE TYPE` do enum, o `ON DELETE cascade` e o índice único.
- [x] 3.2 Criar `src/database/client.ts` (`createDatabase({ url })` com `drizzle-orm/bun-sql`, retornando `{ database, closeDatabase }`) e `src/database/migrate.ts` (aplica `backend/drizzle/` com `drizzle-orm/bun-sql/migrator`); verificar que `bun run db:migrate` cria as tabelas no `kanban` (`\d cards` no psql) e que rodar de novo não muda nada.
- [x] 3.3 Criar o preload `src/test/setup-database.ts` (aplica as migrações no `kanban_test`, falha com mensagem citando `docker compose up -d` quando o Postgres está fora do ar, exporta `resetDatabase()` com `truncate ... cascade`) e registrá-lo em `[test] preload`; verificar que `bun test` passa com o Postgres no ar e mostra a mensagem com ele parado (`docker compose stop`).
- [x] 3.4 Atualizar o `AGENTS.md` (mapa com `docker-compose.yml`, `drizzle/` e `src/database/`; Postgres na tabela de serviços; comandos `docker compose up -d`, `bun run db:generate` e `bun run db:migrate`; pré-requisito de Docker na seção de testes do backend) e trocar o texto de template do `backend/README.md` por como rodar o backend; verificar seguindo os comandos documentados a partir de `docker compose down -v`.

## 4. App HTTP e entrada do backend

- [x] 4.1 Criar `src/main/app.ts` com `createApp({ database })`: CORS restrito a `CORS_ORIGIN`, `onError` usando o error handler, `maxRequestBodySize` de 1 MB e `GET /health`; verificar com `src/main/app.spec.ts` (via `app.handle`) cobrindo `/health` → 200 `{ status: 'ok' }`, header CORS para a origem permitida e rota desconhecida → 404 no formato padrão.
- [x] 4.2 Reescrever `src/index.ts` (ambiente → `createDatabase` → `createApp` → `listen(env.PORT)`, logs com pino, sem `console.log`) e extrair `createShutdownHandler({ stopServer, closeDatabase, logger, timeoutInMs })` para `SIGTERM`/`SIGINT`; verificar com spec do handler (para o servidor e depois fecha o banco, ignora o segundo sinal, força a parada após o prazo) e com `bun run dev` + `curl localhost:3333/health` → 200, e Ctrl+C registrando o desligamento.

## 5. API de projetos

- [x] 5.1 Criar `src/projects/project-repository.ts` (listar por `lower(name)`, buscar por id, criar, renomear, excluir; violação `23505` → `ConflictError`, ausência → `NotFoundError`); verificar com specs de integração no `kanban_test` cobrindo ordem alfabética, nome repetido com outra capitalização, renomear trocando só a capitalização e exclusão removendo os cards em cascata.
- [x] 5.2 Criar `src/projects/project-routes.ts` (`GET`/`POST /projects`, `GET`/`PATCH`/`DELETE /projects/:projectId`; zod com `trim` e 1 a 80 caracteres; id que não é UUID → 404) e montá-lo em `createApp`; verificar com specs de contrato HTTP para cada cenário de `specs/projects/spec.md`: 201 com nome sem espaços nas pontas, 400 para nome em branco ou com 81 caracteres, 409 para nome repetido, 200 na listagem ordenada e na renomeação, 204 na exclusão, 404 para projeto inexistente e id malformado.
- [x] 5.3 Documentar os endpoints de projetos no `backend/README.md` (tabela do design D6 e formato de erro); verificar os exemplos do README com `curl` contra o servidor de desenvolvimento.

## 6. API de cards e movimentação

- [x] 6.1 Criar `src/cards/card-stage.ts` (`CARD_STAGE` `as const`, lista ordenada das colunas e o tipo `CardStage`); verificar com `bun check`.
- [x] 6.2 Criar a função pura `src/cards/plan-card-move.ts`; verificar com `plan-card-move.spec.ts` cobrindo: mover para outra coluna numa posição escolhida, pular etapas, voltar etapa, posição além do fim indo para o fim, subir e descer na mesma coluna, mover para o mesmo lugar sem mudanças, as duas colunas sem lacunas após o movimento e card inexistente gerando erro.
- [x] 6.3 Criar `src/cards/card-repository.ts` (listar por ordem de coluna e posição, criar no fim do Backlog, editar título e descrição, excluir renumerando a coluna, mover numa transação com `for('update')` na linha do projeto e `planCardMove`); verificar com specs de integração cobrindo cada operação, card de outro projeto → `NotFoundError` e posições sem lacunas depois de criar, mover e excluir.
- [x] 6.4 Criar `src/cards/card-routes.ts` (`GET`/`POST /projects/:projectId/cards`, `PATCH`/`DELETE /projects/:projectId/cards/:cardId`, `POST .../move`; zod com título de 1 a 120 caracteres após `trim`, descrição até 5.000, `stage` entre as cinco colunas e `position` inteira ≥ 0) e montá-lo em `createApp`; verificar com specs de contrato HTTP para os cenários de `specs/kanban-board/spec.md` observáveis na API: validações, posição além do fim, coluna inválida, posição negativa, card pelo projeto errado → 404 e organização persistida conferida por `GET` após o movimento.
- [x] 6.5 Documentar os endpoints de cards no `backend/README.md`; verificar que `bun check` passa, que `bun test` passa com cobertura ≥ 80% e que `bunx madge --circular --extensions ts --ts-config tsconfig.json src` não acha ciclos.

## 7. Base do frontend

- [x] 7.1 Adicionar `@tanstack/react-query`, `@tanstack/react-router-ssr-query`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities`, e como dev `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event` e `@testing-library/jest-dom`, com `bun add`; verificar versões exatas no `frontend/package.json` e `bun install` passando.
- [x] 7.2 Criar `vitest.config.ts` (plugin React, jsdom, setup com os matchers do jest-dom, `restoreMocks`, cobertura v8 com limite de 80% em linhas, branches e funções, aliases `#/` e `@/`), o script `"test": "vitest run --coverage"` e o helper `src/test/render-with-providers.tsx` (QueryClient sem retry e router em memória); atualizar a seção de testes do frontend no `AGENTS.md`; verificar que `bun run test` roda o spec da tarefa 7.3.
- [x] 7.3 Criar `frontend/.env.example` (`VITE_API_URL=http://localhost:3333`) e `src/config/env.ts` com zod; verificar com `env.spec.ts` cobrindo variável ausente, URL inválida e URL válida.
- [x] 7.4 Criar `src/api/http-client.ts` (`requestJson({ path, method, body, schema })` com `AbortSignal.timeout` de 10 s e `ApiError { status, code, message }`); verificar com `http-client.spec.ts` (`fetch` substituído) cobrindo sucesso validado, 204 sem corpo, erro 4xx e 5xx com o corpo padrão, corpo com formato inesperado, falha de rede e timeout.
- [x] 7.5 Integrar a QueryClient ao router: `getRouter` cria a `QueryClient` e chama `setupRouterSsrQueryIntegration`, `__root.tsx` usa `createRootRouteWithContext<{ queryClient: QueryClient }>()`, `lang="pt-BR"` e título "Kanban", e o conteúdo do starter sai de `index.tsx`; verificar com `bun check` e `bun --bun run build`.

## 8. Tela de projetos

- [x] 8.1 Criar `src/types/project.ts` (schemas zod e tipos) e `src/api/projects-api.ts` (listar, buscar, criar, renomear, excluir); verificar com `projects-api.spec.ts` cobrindo método, caminho e corpo de cada chamada e a validação das respostas.
- [x] 8.2 Criar em `src/features/projects/` o `projectsQueryOptions` e os hooks `useCreateProject`, `useRenameProject` e `useDeleteProject`, que invalidam a lista; verificar com specs via `renderHook`.
- [x] 8.3 Criar `ProjectList` (links para `/projects/$projectId`), o estado vazio, `CreateProjectForm` (rótulo, validação de 1 a 80 caracteres após `trim`, mensagem do servidor para 409), a ação de renomear e `DeleteProjectDialog` (confirmar e cancelar), e a rota `/` com loader `ensureQueryData`; verificar com specs de componente para cada cenário de interface de `specs/projects/spec.md` e criando, renomeando e excluindo um projeto no navegador com os dois servidores rodando.

## 9. Quadro kanban

- [x] 9.1 Criar `src/types/card.ts` (`CARD_STAGE`, lista ordenada, rótulos `Record<CardStage, string>` e schema zod do card) e `src/api/cards-api.ts` (listar, criar, editar, excluir, mover); verificar com `cards-api.spec.ts` cobrindo método, caminho e corpo de cada chamada e a validação das respostas.
- [x] 9.2 Criar `src/features/board/plan-card-move.ts`; verificar com spec que repete os cenários da tarefa 6.2.
- [x] 9.3 Criar a rota `/projects/$projectId` com loader (`ensureQueryData` de projeto e cards), `notFound()` quando a API responde 404 e `notFoundComponent` com "Projeto não encontrado" e link para `/`; verificar com specs dos estados carregado e não encontrado.
- [x] 9.4 Criar `Board`, `BoardColumn` (nome e contagem, `section` com `aria-label`) e `CardItem`; verificar com specs cobrindo as cinco colunas na ordem com as contagens, inclusive vazias, e o quadro mostrando só os cards do projeto.
- [x] 9.5 Criar `CreateCardDialog` (botão "Novo card", título e descrição com validação de 1 a 120 e até 5.000 caracteres), `EditCardDialog` e `DeleteCardDialog` com `<dialog>` nativo, e os hooks `useCreateCard`, `useUpdateCard` e `useDeleteCard`; verificar com specs dos cenários de "Criar card no Backlog", "Editar card" e "Excluir card".
- [x] 9.6 Criar `MoveCardMenu` ("Mover para" com `aria-expanded`, listando as outras quatro colunas e movendo para o fim da escolhida) e `useMoveCard` (atualização otimista com `planCardMove`, desfaz em erro, alerta "Não foi possível mover o card. Tente de novo." em `role="alert"`, nova busca ao terminar); verificar com specs cobrindo o movimento só pelo teclado, a coluna atual fora das opções e a falha que devolve o card e mostra o alerta.
- [x] 9.7 Ligar o arrastar e soltar: `DndContext` com `id` de `useId()`, um `SortableContext` por coluna, colunas vazias aceitando o card, sensores de ponteiro (com distância mínima), toque e teclado, anúncios em português e `onDragEnd` chamando `useMoveCard`; extrair `resolveDropTarget({ activeId, overId, cardsByStage })` para converter o soltar em `{ stage, position }`; verificar com spec de `resolveDropTarget` (soltar sobre card, sobre coluna vazia, na mesma coluna) e arrastando entre colunas e dentro de uma coluna no navegador, sem aviso de hidratação no console.
- [x] 9.8 Verificar o frontend inteiro: `bun check`, `bun run test` com cobertura ≥ 80% e `bun --bun run build` passando.

## 10. E2E

- [x] 10.1 Criar o `package.json` da raiz (privado, script `"test:e2e": "playwright test"`) e o `bunfig.toml` da raiz (`exact = true`, `minimumReleaseAge = 259200`), adicionar `@playwright/test` com `bun add -d`, instalar o navegador com `bunx playwright install chromium` e ignorar `test-results/` e `playwright-report/` no `.gitignore` da raiz; verificar com `bunx playwright --version`.
- [x] 10.2 Criar `playwright.config.ts` com `webServer` para o backend (pasta `backend`, `bun run db:migrate && bun src/index.ts`, `DATABASE_URL` do `kanban_e2e`, `PORT=3334`, `CORS_ORIGIN=http://localhost:3001`, espera em `/health`) e para o frontend (pasta `frontend`, `bun --bun run dev --port 3001`, `VITE_API_URL=http://localhost:3334`), com `reuseExistingServer` desligado em CI; verificar com `bun run test:e2e --list`.
- [x] 10.3 Criar `e2e/manage-projects.e2e-spec.ts`: criar um projeto com nome único, vê-lo na lista, renomeá-lo, abrir o quadro com as cinco colunas e excluí-lo confirmando; verificar que o spec passa.
- [x] 10.4 Criar `e2e/move-card.e2e-spec.ts`: criar um card no Backlog, movê-lo para Explore pelo "Mover para" usando só o teclado, arrastá-lo de Explore para Apply, recarregar a página e conferir o card em Apply; verificar que o spec passa.
- [x] 10.5 Atualizar o `AGENTS.md`: remover a frase de que não há `package.json` na raiz, incluir `e2e/`, `playwright.config.ts` e o `package.json` da raiz no mapa e o comando de E2E com o pré-requisito de Docker em comandos e testes; verificar seguindo o texto a partir do zero (`docker compose up -d`, `bun install` na raiz e nos dois apps, `bun run test:e2e`).

## 11. Verificação integrada

- [x] 11.1 Com o Docker no ar, rodar backend (`bun check`, `bun test` com cobertura ≥ 80%), frontend (`bun check`, `bun run test` com cobertura ≥ 80%, `bun --bun run build`), E2E na raiz (`bun run test:e2e`) e `openspec validate add-kanban-board --strict`; verificar que tudo passa.

## Workflow follow-up

- Revisar o código e arquivar a change com o skill `openspec-archive-change`.
- Próximas changes: login (antes de publicar o app) e deploy (imagem, banco gerenciado, onde rodar as migrações, URL interna do SSR).

## 12. Reorganização conforme as regras de estrutura

- [x] 12.1 Backend reorganizado em `domain/`, `use-cases/`, `providers/drizzle/`, `controllers/` e `main/` (entrada em `src/main/server.ts`), com alias `@/` e specs de use cases, controllers e repositórios.
- [x] 12.2 Contrato de erro `{ code, message }` com um código por erro de domínio; frontend escolhe o texto pelo `code`.
- [x] 12.3 Frontend reorganizado em `views/`, `components/`, `hooks/`, `services/` e `types/`.
- [x] 12.4 E2E dividido em `e2e/api/` (um por rota), `e2e/flows/` e `e2e/support/`; `docker-compose.yml`, `.env.example` e scripts `dev`/`test` na raiz.
