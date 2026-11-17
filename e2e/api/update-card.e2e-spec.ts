import { expect, test } from '@playwright/test'
import { createCard, createProject } from '../support/api-fixtures'

test.describe('PATCH /projects/:projectId/cards/:cardId', () => {
  test('updates title and description keeping stage and position', async ({ request }) => {
    const { project } = await createProject({ request })
    const { card } = await createCard({ request, projectId: project.id, title: 'A' })
    const data = { title: 'A revisado', description: 'detalhes' }

    const response = await request.patch(`/projects/${project.id}/cards/${card.id}`, { data })

    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ card: expect.objectContaining({ ...data, stage: 'backlog', position: 0 }) })
  })

  for (const { label, data } of [
    { label: 'a blank title', data: { title: ' ' } },
    { label: 'an empty body', data: {} },
  ]) {
    test(`answers 400 VALIDATION_ERROR for ${label} and keeps the card`, async ({ request }) => {
      const { project } = await createProject({ request })
      const { card } = await createCard({ request, projectId: project.id, title: 'A' })

      const response = await request.patch(`/projects/${project.id}/cards/${card.id}`, { data })

      expect(response.status()).toBe(400)
      expect((await (await request.get(`/projects/${project.id}/cards`)).json()).cards[0].title).toBe('A')
    })
  }

  test('answers 404 CARD_NOT_FOUND for a card of another project', async ({ request }) => {
    const { project } = await createProject({ request })
    const { project: other } = await createProject({ request })
    const { card } = await createCard({ request, projectId: project.id, title: 'A' })

    const response = await request.patch(`/projects/${other.id}/cards/${card.id}`, { data: { title: 'X' } })

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'CARD_NOT_FOUND' })
  })
})
