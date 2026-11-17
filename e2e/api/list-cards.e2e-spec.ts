import { expect, test } from '@playwright/test'
import { createCard, createProject } from '../support/api-fixtures'

test.describe('GET /projects/:projectId/cards', () => {
  test('lists only the cards of the project', async ({ request }) => {
    const { project } = await createProject({ request })
    const { project: other } = await createProject({ request })
    const { card } = await createCard({ request, projectId: project.id, title: 'A' })
    await createCard({ request, projectId: other.id, title: 'B' })

    const response = await request.get(`/projects/${project.id}/cards`)

    expect(response.status()).toBe(200)
    expect((await response.json()).cards).toEqual([expect.objectContaining({ id: card.id, title: 'A' })])
  })

  test('answers 404 PROJECT_NOT_FOUND for a project that does not exist', async ({ request }) => {
    const response = await request.get(`/projects/${crypto.randomUUID()}/cards`)

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'PROJECT_NOT_FOUND' })
  })

  test('answers 404 NOT_FOUND for a malformed project id', async ({ request }) => {
    const response = await request.get('/projects/abc/cards')

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' })
  })
})
