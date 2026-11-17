import { expect, test } from '@playwright/test'
import { createCard, createProject } from '../support/api-fixtures'

test.describe('DELETE /projects/:projectId/cards/:cardId', () => {
  test('deletes the card, keeps the order of the others and answers 204', async ({ request }) => {
    const { project } = await createProject({ request })
    await createCard({ request, projectId: project.id, title: 'A' })
    const { card } = await createCard({ request, projectId: project.id, title: 'B' })
    await createCard({ request, projectId: project.id, title: 'C' })

    const response = await request.delete(`/projects/${project.id}/cards/${card.id}`)

    expect(response.status()).toBe(204)
    const { cards } = await (await request.get(`/projects/${project.id}/cards`)).json()
    expect(cards.map((remaining: { title: string; position: number }) => [remaining.title, remaining.position])).toEqual([
      ['A', 0],
      ['C', 1],
    ])
  })

  test('answers 404 CARD_NOT_FOUND for a card of another project and keeps it', async ({ request }) => {
    const { project } = await createProject({ request })
    const { project: other } = await createProject({ request })
    const { card } = await createCard({ request, projectId: project.id, title: 'A' })

    const response = await request.delete(`/projects/${other.id}/cards/${card.id}`)

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'CARD_NOT_FOUND' })
    expect((await (await request.get(`/projects/${project.id}/cards`)).json()).cards).toHaveLength(1)
  })
})
