import { expect, test } from '@playwright/test'
import { createProject } from '../support/api-fixtures'

test.describe('GET /projects/:projectId', () => {
  test('answers 200 with the project', async ({ request }) => {
    const { project } = await createProject({ request })

    const response = await request.get(`/projects/${project.id}`)

    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ project: expect.objectContaining({ id: project.id, name: project.name }) })
  })

  test('answers 404 PROJECT_NOT_FOUND for a project that does not exist', async ({ request }) => {
    const response = await request.get(`/projects/${crypto.randomUUID()}`)

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'PROJECT_NOT_FOUND' })
  })

  test('answers 404 NOT_FOUND for a malformed id', async ({ request }) => {
    const response = await request.get('/projects/not-a-uuid')

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' })
  })
})
