import { expect, test } from '@playwright/test'
import { buildUniqueName } from '../support/build-unique-name'

const MAX_NAME_LENGTH = 80

test.describe('POST /projects', () => {
  test('creates the project with surrounding spaces removed', async ({ request }) => {
    const { name } = buildUniqueName({ prefix: 'e2e-criar' })

    const response = await request.post('/projects', { data: { name: `  ${name}  ` } })

    expect(response.status()).toBe(201)
    expect(await response.json()).toEqual({
      project: { id: expect.any(String), name, createdAt: expect.any(String), updatedAt: expect.any(String) },
    })
  })

  test('accepts a name of exactly 80 characters', async ({ request }) => {
    const { name } = buildUniqueName({ prefix: 'e2e' })

    const response = await request.post('/projects', { data: { name: name.padEnd(MAX_NAME_LENGTH, 'x') } })

    expect(response.status()).toBe(201)
  })

  for (const name of ['', '   ', 'a'.repeat(MAX_NAME_LENGTH + 1)]) {
    test(`answers 400 VALIDATION_ERROR for the name of ${name.length} characters`, async ({ request }) => {
      const response = await request.post('/projects', { data: { name } })

      expect(response.status()).toBe(400)
      expect(await response.json()).toEqual({ code: 'VALIDATION_ERROR', message: expect.any(String) })
    })
  }

  test('answers 409 PROJECT_NAME_ALREADY_EXISTS for a name used with other capitalization', async ({ request }) => {
    const { name } = buildUniqueName({ prefix: 'E2E-Duplicado' })
    await request.post('/projects', { data: { name } })

    const response = await request.post('/projects', { data: { name: name.toLowerCase() } })

    expect(response.status()).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'PROJECT_NAME_ALREADY_EXISTS' })
  })

  test('answers 400 VALIDATION_ERROR for a malformed JSON body', async ({ request }) => {
    const response = await request.post('/projects', { headers: { 'content-type': 'application/json' }, data: '{not json' })

    expect(response.status()).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})
