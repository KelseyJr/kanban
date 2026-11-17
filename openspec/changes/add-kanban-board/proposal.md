# Proposal

## Why

O andamento das changes do OpenSpec (explore → propose → apply → archive) hoje só aparece no terminal e na pasta `openspec/changes/`: não há uma visão única de onde cada ideia está nem do que falta fazer em cada projeto. Um kanban com uma coluna por etapa do OpenSpec, separado por projeto, dá essa visão e permite mover cada atividade conforme as etapas terminam. O repositório tem apenas o scaffold dos dois apps, então este é o momento de escolher o banco e a base técnica antes da primeira funcionalidade, para não refazer depois.

## What Changes

- **Projetos**: criar, listar, renomear e excluir projetos. Cada projeto tem seu próprio quadro; excluir um projeto exclui seus cards.
- **Quadro por projeto** com cinco colunas fixas, nesta ordem: Backlog, Explore, Propose, Apply e Archive. Os nomes seguem os comandos do OpenSpec.
- **Cards** com título obrigatório e descrição opcional: criar (sempre no fim do Backlog), editar e excluir.
- **Movimentação**: mover um card para qualquer coluna (avançar, voltar ou pular etapas) e reordenar dentro da coluna, arrastando e soltando ou pela ação "Mover para", acessível pelo teclado. Se o movimento não for salvo, o card volta ao lugar e a interface mostra um erro.
- **Persistência em PostgreSQL** com migrações versionadas: coluna e ordem dos cards continuam iguais ao recarregar a página.
- **API HTTP** no backend para projetos e cards, e interface no frontend que consome essa API. Toda a interface em português.
- **Base técnica** que as próximas changes reutilizam: ambiente validado na inicialização, logger, desligamento gracioso, CORS, Postgres em Docker para desenvolvimento e testes, testes unitários e de integração nos dois apps e E2E com Playwright na raiz.

Fora do escopo, para próximas changes: login e autenticação, deploy (imagem, hospedagem, banco gerenciado), colunas personalizáveis, integração automática com o CLI do OpenSpec (ler `openspec/changes` e mover cards sozinho), vínculo do card com o nome da change, etiquetas, responsáveis, prazos e atualização em tempo real entre abas. Até o login existir, o app não deve ser publicado.

## Capabilities

### New Capabilities

- `projects`: cadastro de projetos (criar, listar, renomear, excluir), cada um dono de um quadro e dos seus cards.
- `kanban-board`: o quadro de um projeto: colunas fixas do fluxo OpenSpec, ciclo de vida dos cards e movimentação e ordenação dos cards entre as colunas.

### Modified Capabilities

Nenhuma: o projeto ainda não tem specs.

## Impact

- **backend**: módulo de banco (PostgreSQL 18 via Drizzle ORM sobre o cliente nativo `Bun.sql`), migrações SQL versionadas em `backend/drizzle/`, rotas `/health`, `/projects` e `/projects/:projectId/cards`, módulo de ambiente, logger e desligamento gracioso. Novas dependências: `drizzle-orm`, `drizzle-kit`, `zod`, `pino`, `@elysiajs/cors`. Novos arquivos: `docker-compose.yml`, `.env.example`, `.env.test`.
- **frontend**: página de projetos (`/`) e página do quadro (`/projects/$projectId`), dados via TanStack Query integrada ao SSR do TanStack Start, arrastar e soltar com dnd-kit, validação com `zod`, testes com Vitest e Testing Library. Novo `.env.example` com `VITE_API_URL`.
- **raiz**: pasta `e2e/`, `playwright.config.ts` e um `package.json` só com o Playwright e o script de E2E. O `AGENTS.md` hoje afirma que não há `package.json` na raiz e precisa ser atualizado, junto com o mapa, os comandos e a seção de testes.
- **Ambiente de desenvolvimento**: rodar o backend e os testes passa a exigir Docker (ou um PostgreSQL local).
