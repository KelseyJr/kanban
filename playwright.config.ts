import { defineConfig, devices } from '@playwright/test'
import { e2eEnv } from './e2e/support/env'
import { E2E_API_PORT, E2E_API_URL, E2E_WEB_PORT, E2E_WEB_URL } from './e2e/support/urls'

const SERVER_START_TIMEOUT_IN_MS = 120_000
const isCi = Boolean(process.env.CI)

export default defineConfig({
  testMatch: '**/*.e2e-spec.ts',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? 'github' : 'list',
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'api', testDir: './e2e/api', use: { baseURL: E2E_API_URL } },
    {
      name: 'flows',
      testDir: './e2e/flows',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: E2E_WEB_URL },
    },
  ],
  webServer: [
    {
      cwd: 'backend',
      command: 'bun run db:migrate && bun src/main/server.ts',
      url: `${E2E_API_URL}/health`,
      env: { DATABASE_URL: e2eEnv.E2E_DATABASE_URL, PORT: String(E2E_API_PORT), CORS_ORIGIN: E2E_WEB_URL, LOG_LEVEL: 'warn' },
      reuseExistingServer: !isCi,
      timeout: SERVER_START_TIMEOUT_IN_MS,
    },
    {
      cwd: 'frontend',
      command: `bun --bun run dev --port ${E2E_WEB_PORT}`,
      url: E2E_WEB_URL,
      env: { VITE_API_URL: E2E_API_URL },
      reuseExistingServer: !isCi,
      timeout: SERVER_START_TIMEOUT_IN_MS,
    },
  ],
})
