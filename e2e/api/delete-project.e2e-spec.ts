import { expect, test } from '@playwright/test'
import { createProject } from '../support/api-fixtures'

test.describe('DELETE /projects/:projectId', () => {
  test('deletes the project and answers 204 with no body', async ({ request }) => {
    const { project } = await createProject({ request })

    const response = await request.delete(`/projects/${project.id}`)

    expect(response.status()).toBe(204)
    expect((await request.get(`/projects/${project.id}`)).status()).toBe(404)
  })

  test('answers 404 PROJECT_NOT_FOUND for a project that does not exist', async ({ request }) => {
    const response = await request.delete(`/projects/${crypto.randomUUID()}`)

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'PROJECT_NOT_FOUND' })
  })

  test('answers 404 NOT_FOUND for a malformed id', async ({ request }) => {
    const response = await request.delete('/projects/123')

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' })
  })
})
