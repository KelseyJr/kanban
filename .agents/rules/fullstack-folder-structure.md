# Fullstack Folder Structure

Apply this structure to repositories that hold a backend and a frontend together. It sets the repository root only: inside `backend/` and `frontend/`, each app keeps its own structure, except for E2E tests, which follow this rule.

## 1. Project layout

```
.
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── e2e/
│   └── create-user.e2e-spec.ts
├── package.json
└── playwright.config.ts
```

- `backend/` and `frontend/` are independent apps: each has its own dependencies, config files, `.env` and scripts, and runs on its own.
- The apps talk only over HTTP. The frontend keeps its own types for the API responses in `frontend/src/types/` and imports nothing from `backend/`.
- The root holds only what spans both apps: the E2E suite, its Playwright config, and a `package.json` with scripts that start both apps and run the E2E suite.

## 2. E2E tests

The root `e2e/` replaces the `e2e/` folder of each app. Its Playwright specs run full user flows in the browser against both apps running together, one spec per flow: `e2e/create-user.e2e-spec.ts`. API-only checks use Playwright's `request` fixture in the same folder.

- `playwright.config.ts` starts both apps through `webServer` before the suite runs, with the backend pointed at a test database.
- Unit specs stay inside each app (`backend/src/`, `frontend/src/`), next to the code they test.

---

Before finishing, check that each file you created sits in the app it belongs to, follows that app's structure, and that every new user flow has a spec in the root `e2e/`.
