import { expect, test } from '@playwright/test'
import { createCard, createProject } from '../support/api-fixtures'

const MAX_TITLE_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 5000

test.describe('POST /projects/:projectId/cards', () => {
  test('creates the card at the end of the backlog with an empty description', async ({ request }) => {
    const { project } = await createProject({ request })
    await createCard({ request, projectId: project.id, title: 'A' })

    const response = await request.post(`/projects/${project.id}/cards`, { data: { title: '  CI  ' } })

    expect(response.status()).toBe(201)
    expect(await response.json()).toEqual({
      card: {
        id: expect.any(String),
        projectId: project.id,
        stage: 'backlog',
        position: 1,
        title: 'CI',
        description: '',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    })
  })

  test('accepts the maximum title and description lengths', async ({ request }) => {
    const { project } = await createProject({ request })
    const data = { title: 'a'.repeat(MAX_TITLE_LENGTH), description: 'd'.repeat(MAX_DESCRIPTION_LENGTH) }

    const response = await request.post(`/projects/${project.id}/cards`, { data })

    expect(response.status()).toBe(201)
  })

  const invalidBodies = [
    { label: 'a blank title', data: { title: '   ' } },
    { label: 'a title over the limit', data: { title: 'a'.repeat(MAX_TITLE_LENGTH + 1) } },
    { label: 'a description over the limit', data: { title: 'A', description: 'd'.repeat(MAX_DESCRIPTION_LENGTH + 1) } },
    { label: 'no title', data: {} },
  ]
  for (const { label, data } of invalidBodies) {
    test(`answers 400 VALIDATION_ERROR for ${label} and creates nothing`, async ({ request }) => {
      const { project } = await createProject({ request })

      const response = await request.post(`/projects/${project.id}/cards`, { data })

      expect(response.status()).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
      expect((await (await request.get(`/projects/${project.id}/cards`)).json()).cards).toEqual([])
    })
  }

  test('answers 404 PROJECT_NOT_FOUND for a project that does not exist', async ({ request }) => {
    const response = await request.post(`/projects/${crypto.randomUUID()}/cards`, { data: { title: 'A' } })

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'PROJECT_NOT_FOUND' })
  })
})
