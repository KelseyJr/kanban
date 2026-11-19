import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test'
import { E2E_TARGET, e2eEnv } from './e2e/support/env'
import { E2E_API_PORT, E2E_API_URL, E2E_WEB_PORT, E2E_WEB_URL } from './e2e/support/urls'

const SERVER_START_TIMEOUT_IN_MS = 120_000
const isCi = Boolean(process.env.CI)

type BuildWebServersResult = {
  webServer: PlaywrightTestConfig['webServer']
}

function buildWebServers(): BuildWebServersResult {
  if (e2eEnv.target === E2E_TARGET.stack) return { webServer: undefined }

  return {
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
        env: { API_URL: E2E_API_URL },
        reuseExistingServer: !isCi,
        timeout: SERVER_START_TIMEOUT_IN_MS,
      },
    ],
  }
}

// In stack mode the flows go through Caddy, which asks for basic auth; the api project talks to the backend directly
const httpCredentials =
  e2eEnv.target === E2E_TARGET.stack
    ? { username: e2eEnv.E2E_BASIC_AUTH_USER, password: e2eEnv.E2E_BASIC_AUTH_PASSWORD }
    : undefined

export default defineConfig({
  testMatch: '**/*.e2e-spec.ts',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'api', testDir: './e2e/api', use: { baseURL: E2E_API_URL } },
    {
      name: 'flows',
      testDir: './e2e/flows',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: E2E_WEB_URL, httpCredentials },
    },
  ],
  ...buildWebServers(),
})
