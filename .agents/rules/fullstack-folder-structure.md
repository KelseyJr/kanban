# Fullstack Folder Structure

Apply this structure to repositories that hold a backend and a frontend together. Examples use TypeScript, npm and Prisma; in a project with other tools, use their equivalents.

Inside `backend/` and `frontend/`, each app follows the structure of a standalone backend or frontend project, with its paths read from the app folder: `src/domain/user/` means `backend/src/domain/user/`, and `src/views/users/` means `frontend/src/views/users/`. This rule sets what exists because the two apps live together: the repository root, the API contract between them, and the E2E suite.

## 1. Project layout

```
.
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── e2e/
│   ├── api/
│   │   └── create-user.e2e-spec.ts
│   ├── flows/
│   │   └── sign-up.e2e-spec.ts
│   └── support/
│       ├── env.ts
│       └── build-unique-email.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── docker-compose.yml
├── package.json
└── playwright.config.ts
```

- `backend/` and `frontend/` are independent apps: each has its own dependencies, config files, `.env` and scripts, and runs on its own. Each app installs its dependencies in its own folder.
- Each app keeps its unit suite, with specs next to the code they test (`backend/src/`, `frontend/src/`). The E2E suite lives at the root (section 4).

The root holds what spans both apps; everything else lives in the app it belongs to:

| Path                           | Holds                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `package.json`                 | The cross-app scripts (section 3), with `@playwright/test` and `concurrently` as its only dependencies   |
| `playwright.config.ts`, `e2e/` | The E2E suite (section 4)                                                                                |
| `.env.example`                 | The variables the E2E suite reads (`E2E_DATABASE_URL`); the real values go in the gitignored root `.env` |
| `docker-compose.yml`           | Local services the apps run against (database, mail catcher), when the project runs them in containers   |
| `.github/workflows/`           | CI: each app's lint, typecheck and unit suite, then the E2E suite                                        |

## 2. API contract

The apps talk only over HTTP. The backend's controllers define the contract; the frontend mirrors it in its own types and imports nothing from `backend/`.

- Entities the API returns (`User`, `Order`) are mirrored in `frontend/src/types/`, one file per concept. Request params and response wrappers stay in the service that uses them.
- Frontend types mirror the JSON on the wire: a `Date` arrives as an ISO string (`createdAt: string`), and the type holds only the fields the controller sends.
- A change to a request or response shape updates, in the same change, the controller, the frontend types and services that consume it, and the route's spec in `e2e/api/`.

Instead of:

`frontend/src/types/user.ts`:

```ts
export type { User } from '../../../backend/src/domain/user/user.entity'
```

Write:

`frontend/src/types/user.ts`:

```ts
export type User = {
  id: string
  name: string
  email: string
  createdAt: string
}
```

### Errors

The backend's error handler (`backend/src/main/error-handler.ts`) answers every error with the same body:

```json
{ "code": "USER_ALREADY_EXISTS", "message": "User ana@email.com already exists" }
```

- `code` is a stable UPPER_SNAKE_CASE identifier, one per domain error. Validation failures answer 400 with `VALIDATION_ERROR`; unexpected errors answer 500 with `INTERNAL_ERROR` and a generic message.
- `frontend/src/services/api.client.ts` turns every non-2xx response into an `ApiError` carrying `status` and `code`. The frontend picks what to show by `code`, with its own text; `message` is for logs.

## 3. Running both apps

The frontend calls the backend directly at `VITE_API_URL`, and the backend allows the frontend's origin through CORS. Each app validates its variables at startup in its own `src/config/env.ts` and lists them in its own `.env.example`:

| Variable       | Dev value               | Read by                                                      |
| -------------- | ----------------------- | ------------------------------------------------------------ |
| `PORT`         | `3000`                  | `backend/src/main/server.ts`, to listen                      |
| `CORS_ORIGIN`  | `http://localhost:5173` | `backend/src/main/server.ts`, as the only origin CORS allows |
| `VITE_API_URL` | `http://localhost:3000` | `frontend/src/services/api.client.ts`, as the base URL       |

The root `package.json` runs both apps through each app's own scripts:

```json
{
  "private": true,
  "scripts": {
    "dev": "concurrently -n backend,frontend \"npm --prefix backend run dev\" \"npm --prefix frontend run dev\"",
    "test": "npm --prefix backend test && npm --prefix frontend test",
    "test:e2e": "playwright test"
  }
}
```

| Script             | Runs                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `npm run dev`      | Both apps on their dev ports, side by side                           |
| `npm test`         | Each app's unit suite                                                |
| `npm run test:e2e` | The E2E suite, starting both apps on the E2E ports and test database |

## 4. E2E tests

The root suite is the repository's only E2E suite: Playwright runs it against both apps started together, with the backend on a test database. Each app keeps only its unit suite, and every E2E spec the apps need goes here:

| Folder       | One spec per  | Named after                                      | Checks                                                                          |
| ------------ | ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `e2e/api/`   | Backend route | The controller action: `create-user.e2e-spec.ts` | Status codes, payloads and error bodies, through Playwright's `request` fixture |
| `e2e/flows/` | User flow     | The flow: `sign-up.e2e-spec.ts`                  | The flow in the browser, as the user runs it                                    |

- `e2e/support/` holds what the specs share: `env.ts`, which reads the root `.env` and validates it at startup, and helpers such as `build-unique-email.ts`.
- The E2E ports differ from the dev ports, so the suite always starts its own servers on the test database, even while `npm run dev` runs.
- Each app lets variables already set in the environment win over its `.env` file, so the values `playwright.config.ts` passes reach it.
- The backend serves `GET /health` with a 200, which Playwright waits on before running the suite.
- Specs create the data they need with unique values and assert only on the records they created, so they run in parallel and pass on a database that keeps data from earlier runs.

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'
import { e2eEnv } from './e2e/support/env'

const E2E_BACKEND_PORT = 3001
const E2E_FRONTEND_PORT = 5174
const E2E_BACKEND_URL = `http://localhost:${E2E_BACKEND_PORT}`
const E2E_FRONTEND_URL = `http://localhost:${E2E_FRONTEND_PORT}`

export default defineConfig({
  testMatch: '**/*.e2e-spec.ts',
  projects: [
    { name: 'api', testDir: './e2e/api', use: { baseURL: E2E_BACKEND_URL } },
    { name: 'flows', testDir: './e2e/flows', use: { baseURL: E2E_FRONTEND_URL } },
  ],
  webServer: [
    {
      cwd: 'backend',
      command: 'npx prisma migrate deploy && npm run dev',
      url: `${E2E_BACKEND_URL}/health`,
      env: {
        PORT: String(E2E_BACKEND_PORT),
        DATABASE_URL: e2eEnv.E2E_DATABASE_URL,
        CORS_ORIGIN: E2E_FRONTEND_URL,
      },
    },
    {
      cwd: 'frontend',
      command: `npm run dev -- --port ${E2E_FRONTEND_PORT} --strictPort`,
      url: E2E_FRONTEND_URL,
      env: { VITE_API_URL: E2E_BACKEND_URL },
    },
  ],
})
```

`e2e/api/create-user.e2e-spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { buildUniqueEmail } from '../support/build-unique-email'

test.describe('POST /users', () => {
  test('creates the user when the email is free', async ({ request }) => {
    const { email } = buildUniqueEmail()

    const response = await request.post('/users', { data: { name: 'Ana', email } })

    expect(response.status()).toBe(201)
    expect(await response.json()).toMatchObject({ user: { name: 'Ana', email } })
  })

  test('answers 409 USER_ALREADY_EXISTS when the email is taken', async ({ request }) => {
    const { email } = buildUniqueEmail()
    await request.post('/users', { data: { name: 'Ana', email } })

    const response = await request.post('/users', { data: { name: 'Bia', email } })

    expect(response.status()).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'USER_ALREADY_EXISTS' })
  })
})
```

## 5. Adding a feature

Build the backend first: its responses are the contract the frontend mirrors.

1. **Backend**: the endpoint in `backend/`, following the backend's structure, with each new domain error mapped to a status and a `code`.
2. **API spec**: `e2e/api/<action>.e2e-spec.ts`, covering the success response and each error the route can return.
3. **Frontend**: types, service, hook, components and view in `frontend/`, following the frontend's structure.
4. **Flow spec**: `e2e/flows/<flow>.e2e-spec.ts`, when the feature adds or changes a user flow.
5. **Config**: each new variable in the `.env.example` of the app that reads it, and in its web server's `env` in `playwright.config.ts` when the E2E value differs from the dev one.

---

Before finishing, check that every file you created sits in the app it belongs to and follows that app's structure, every changed request or response shape is mirrored on both sides, every new route has a spec in `e2e/api/` and every new user flow one in `e2e/flows/`, and every new variable is listed in the right `.env.example`. Then run the unit suite of each app you changed and `npm run test:e2e`.
