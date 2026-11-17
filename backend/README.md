# Kanban backend

HTTP API for the Kanban app: Elysia on Bun, PostgreSQL 18 through Drizzle ORM.

## Running locally

Requires Bun and Docker.

```bash
docker compose up -d      # (run at the repo root) Postgres on localhost:5432 (databases kanban, kanban_test, kanban_e2e)
cp .env.example .env      # dev environment
bun install
bun run db:migrate        # apply the migrations in drizzle/
bun run dev               # applies pending migrations, then starts the API on http://localhost:3333
```

| Variable       | Required | Default | Purpose                                   |
| -------------- | -------- | ------- | ----------------------------------------- |
| `DATABASE_URL` | yes      | —       | Postgres connection URL                   |
| `CORS_ORIGIN`  | yes      | —       | the only origin allowed to call the API   |
| `PORT`         | no       | `3333`  | HTTP port                                 |
| `LOG_LEVEL`    | no       | `info`  | pino level (`silent` turns logging off)   |

## Database

- Edit `src/providers/drizzle/schema.ts`, then `bun run db:generate` writes a new SQL migration to `drizzle/`. Commit it.
- `bun run db:migrate` applies pending migrations; running it again changes nothing.
- `docker compose down -v` deletes the databases; `docker compose up -d` recreates them empty.

## Tests

```bash
docker compose up -d      # at the repo root
bun test                  # unit specs and repositories against kanban_test, coverage ≥ 80%
bun check                 # type check
```

Tests use `kanban_test` (from `.env.test`). The preload in `src/test/setup-database.ts` applies the migrations before the run.

## API

JSON in and out. Dates are ISO 8601 strings. Every error answers `{ "code", "message" }`; `code` is stable and `message` is for logs:

| Status | `code`                        | When                                                              |
| ------ | ----------------------------- | ----------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`            | invalid or malformed body (the message says which rule failed)    |
| 404    | `PROJECT_NOT_FOUND`           | the project does not exist                                        |
| 404    | `CARD_NOT_FOUND`              | the card does not exist in that project                           |
| 404    | `NOT_FOUND`                   | unknown route or malformed id (not a UUID)                        |
| 409    | `PROJECT_NAME_ALREADY_EXISTS` | a project with the same name (ignoring case) already exists       |
| 500    | `INTERNAL_ERROR`              | unexpected failure; details go only to the log                    |

### Health

| Method | Path      | Success                  |
| ------ | --------- | ------------------------ |
| `GET`  | `/health` | 200 `{ "status": "ok" }` |

### Projects

A project is `{ id, name, createdAt, updatedAt }`. Names are trimmed and must have 1 to 80 characters.

| Method   | Path                   | Body       | Success                                   |
| -------- | ---------------------- | ---------- | ----------------------------------------- |
| `GET`    | `/projects`            | —          | 200 `{ projects }`, alphabetical, ignoring case |
| `POST`   | `/projects`            | `{ name }` | 201 `{ project }`                         |
| `GET`    | `/projects/:projectId` | —          | 200 `{ project }`                         |
| `PATCH`  | `/projects/:projectId` | `{ name }` | 200 `{ project }`                         |
| `DELETE` | `/projects/:projectId` | —          | 204, deleting the project's cards too     |

```bash
curl -s -X POST localhost:3333/projects -H 'content-type: application/json' -d '{"name":"  kanban  "}'
# 201 {"project":{"id":"…","name":"kanban",…}}
curl -s localhost:3333/projects
# 200 {"projects":[{"id":"…","name":"kanban",…}]}
curl -s -X PATCH localhost:3333/projects/<id> -H 'content-type: application/json' -d '{"name":"kanban-app"}'
# 200 {"project":{"id":"…","name":"kanban-app",…}}
curl -s -X DELETE localhost:3333/projects/<id>
# 204
curl -s localhost:3333/projects/not-a-uuid
# 404 {"code":"NOT_FOUND","message":"Recurso não encontrado."}
```

### Cards

A card is `{ id, projectId, stage, position, title, description, createdAt, updatedAt }`.

- `stage` is one of `backlog`, `explore`, `propose`, `apply`, `archive` (the board columns, in that order).
- `position` runs from 0 to n−1 inside each (project, stage), with no gaps.
- Titles are trimmed and must have 1 to 120 characters; descriptions have up to 5,000 characters.
- A card reached through another project's path answers 404 and nothing changes.

| Method   | Path                                      | Body                       | Success                                               |
| -------- | ----------------------------------------- | -------------------------- | ----------------------------------------------------- |
| `GET`    | `/projects/:projectId/cards`              | —                          | 200 `{ cards }`, by stage order then position         |
| `POST`   | `/projects/:projectId/cards`              | `{ title, description? }`  | 201 `{ card }`, at the end of the backlog             |
| `PATCH`  | `/projects/:projectId/cards/:cardId`      | `{ title?, description? }` | 200 `{ card }`; stage and position unchanged          |
| `DELETE` | `/projects/:projectId/cards/:cardId`      | —                          | 204; the rest of the column closes the gap            |
| `POST`   | `/projects/:projectId/cards/:cardId/move` | `{ stage, position }`      | 200 `{ card }`; a position past the end means the end |

```bash
curl -s -X POST localhost:3333/projects/<projectId>/cards -H 'content-type: application/json' -d '{"title":"Configurar CI"}'
# 201 {"card":{"id":"…","stage":"backlog","position":0,"title":"Configurar CI","description":"",…}}
curl -s -X POST localhost:3333/projects/<projectId>/cards/<cardId>/move -H 'content-type: application/json' -d '{"stage":"apply","position":0}'
# 200 {"card":{"id":"…","stage":"apply","position":0,…}}
```
