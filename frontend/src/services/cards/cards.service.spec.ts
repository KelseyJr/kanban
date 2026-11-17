import { describe, expect, it } from 'vitest'
import { stubApi } from '@/test/fetch-stub'
import { buildCard } from '@/test/fixtures'
import { createCard, deleteCard, listCards, moveCard, updateCard } from './cards.service'

const card = buildCard()
const CARDS_PATH = '/projects/project-1/cards'
const CARD_PATH = `${CARDS_PATH}/card-1`

describe('cards API', () => {
  it('lists the cards of a project with GET /projects/:projectId/cards', async () => {
    stubApi({ routes: [{ method: 'GET', path: CARDS_PATH, respond: () => ({ body: { cards: [card] } }) }] })

    const result = await listCards({ projectId: 'project-1' })

    expect(result).toEqual({ cards: [card] })
  })

  it('creates a card with POST sending title and description', async () => {
    const { fetchMock } = stubApi({ routes: [{ method: 'POST', path: CARDS_PATH, respond: () => ({ status: 201, body: { card } }) }] })

    const result = await createCard({ projectId: 'project-1', title: 'Card', description: '' })

    expect(result).toEqual({ card })
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test${CARDS_PATH}`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'Card', description: '' }) }),
    )
  })

  it('updates a card with PATCH sending title and description', async () => {
    const { fetchMock } = stubApi({ routes: [{ method: 'PATCH', path: CARD_PATH, respond: () => ({ body: { card } }) }] })

    await updateCard({ projectId: 'project-1', cardId: 'card-1', title: 'Novo', description: 'detalhes' })

    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test${CARD_PATH}`,
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ title: 'Novo', description: 'detalhes' }) }),
    )
  })

  it('deletes a card with DELETE', async () => {
    const { fetchMock } = stubApi({ routes: [{ method: 'DELETE', path: CARD_PATH, respond: () => ({ status: 204 }) }] })

    await deleteCard({ projectId: 'project-1', cardId: 'card-1' })

    expect(fetchMock).toHaveBeenCalledWith(`http://api.test${CARD_PATH}`, expect.objectContaining({ method: 'DELETE' }))
  })

  it('moves a card with POST .../move sending stage and position', async () => {
    const { fetchMock } = stubApi({ routes: [{ method: 'POST', path: `${CARD_PATH}/move`, respond: () => ({ body: { card } }) }] })

    await moveCard({ projectId: 'project-1', cardId: 'card-1', stage: 'apply', position: 2 })

    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test${CARD_PATH}/move`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ stage: 'apply', position: 2 }) }),
    )
  })

  it('rejects a card with a stage outside the five columns', async () => {
    stubApi({ routes: [{ method: 'GET', path: CARDS_PATH, respond: () => ({ body: { cards: [{ ...card, stage: 'done' }] } }) }] })

    await expect(listCards({ projectId: 'project-1' })).rejects.toMatchObject({ code: 'UNEXPECTED_RESPONSE' })
  })
})
