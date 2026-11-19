import { expect, test } from '@playwright/test'
import { E2E_TARGET, e2eEnv } from '../support/env'
import { E2E_WEB_URL } from '../support/urls'

const HTTP_OK = 200
const HTTP_UNAUTHORIZED = 401

test.skip(e2eEnv.target !== E2E_TARGET.stack, 'Basic auth lives in Caddy, which only runs with E2E_TARGET=stack')

// Plain fetch: Playwright request contexts inherit the project's httpCredentials
type FetchAnonymouslyParams = {
  path: string
}

type FetchAnonymouslyResult = {
  status: number
}

async function fetchAnonymously({ path }: FetchAnonymouslyParams): Promise<FetchAnonymouslyResult> {
  const response = await fetch(`${E2E_WEB_URL}${path}`)
  await response.body?.cancel()

  return { status: response.status }
}

test.describe('access protection', () => {
  test('answers 401 on the app page without credentials', async () => {
    const { status } = await fetchAnonymously({ path: '/' })

    expect(status).toBe(HTTP_UNAUTHORIZED)
  })

  test('answers 401 on the API without credentials', async () => {
    const { status } = await fetchAnonymously({ path: '/api/projects' })

    expect(status).toBe(HTTP_UNAUTHORIZED)
  })

  test('answers 200 on the health check without credentials', async () => {
    const { status } = await fetchAnonymously({ path: '/api/health' })

    expect(status).toBe(HTTP_OK)
  })

  test('user with credentials sees the project list', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Projetos' })).toBeVisible()
  })
})
