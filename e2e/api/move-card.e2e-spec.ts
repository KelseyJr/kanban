import { expect, test } from '@playwright/test'
import { createCard, createProject } from '../support/api-fixtures'

type ColumnCard = {
  title: string
  stage: string
}

test.describe('POST /projects/:projectId/cards/:cardId/move', () => {
  test('moves the card to another column at the chosen position and persists it', async ({ request }) => {
    const { project } = await createProject({ request })
    const { card: cardA } = await createCard({ request, projectId: project.id, title: 'A' })
    await createCard({ request, projectId: project.id, title: 'B' })
    const { card: cardX } = await createCard({ request, projectId: project.id, title: 'X' })
    await request.post(`/projects/${project.id}/cards/${cardX.id}/move`, { data: { stage: 'explore', position: 0 } })

    const response = await request.post(`/projects/${project.id}/cards/${cardA.id}/move`, { data: { stage: 'explore', position: 1 } })

    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ card: expect.objectContaining({ title: 'A', stage: 'explore', position: 1 }) })
    const { cards } = await (await request.get(`/projects/${project.id}/cards`)).json()
    const titlesIn = (stage: string): string[] => cards.filter((card: ColumnCard) => card.stage === stage).map((card: ColumnCard) => card.title)
    expect(titlesIn('backlog')).toEqual(['B'])
    expect(titlesIn('explore')).toEqual(['X', 'A'])
  })

  test('places the card at the end when the position is past the end', async ({ request }) => {
    const { project } = await createProject({ request })
    const { card } = await createCard({ request, projectId: project.id, title: 'A' })

    const response = await request.post(`/projects/${project.id}/cards/${card.id}/move`, { data: { stage: 'apply', position: 10 } })

    expect(await response.json()).toEqual({ card: expect.objectContaining({ stage: 'apply', position: 0 }) })
  })

  for (const { label, data } of [
    { label: 'an unknown stage', data: { stage: 'done', position: 0 } },
    { label: 'a negative position', data: { stage: 'apply', position: -1 } },
    { label: 'a fractional position', data: { stage: 'apply', position: 0.5 } },
  ]) {
    test(`answers 400 VALIDATION_ERROR for ${label} and keeps the card in place`, async ({ request }) => {
      const { project } = await createProject({ request })
      const { card } = await createCard({ request, projectId: project.id, title: 'A' })

      const response = await request.post(`/projects/${project.id}/cards/${card.id}/move`, { data })

      expect(response.status()).toBe(400)
      expect((await (await request.get(`/projects/${project.id}/cards`)).json()).cards[0].stage).toBe('backlog')
    })
  }

  test('answers 404 CARD_NOT_FOUND for a card of another project', async ({ request }) => {
    const { project } = await createProject({ request })
    const { project: other } = await createProject({ request })
    const { card } = await createCard({ request, projectId: project.id, title: 'A' })

    const response = await request.post(`/projects/${other.id}/cards/${card.id}/move`, { data: { stage: 'apply', position: 0 } })

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'CARD_NOT_FOUND' })
  })
})
