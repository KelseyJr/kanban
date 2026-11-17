import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { buildCard } from '@/test/fixtures'
import { CARDS_PATH, renderBoard } from '@/test/render-board'

const cardA = buildCard({ id: 'card-a', title: 'A', stage: 'backlog', position: 0 })
const cardB = buildCard({ id: 'card-b', title: 'B', stage: 'propose', position: 0 })
const cardC = buildCard({ id: 'card-c', title: 'C', stage: 'propose', position: 1 })

type ReadColumnParams = {
  name: string
}

function readColumn({ name }: ReadColumnParams): string[] {
  const column = screen.getByRole('region', { name })
  return within(column).queryAllByRole('heading', { level: 3 }).map((heading) => heading.textContent ?? '')
}

describe('create card', () => {
  it('creates the card at the end of the backlog', async () => {
    const created = buildCard({ id: 'card-new', title: 'Configurar CI', stage: 'backlog', position: 1 })
    const { user, fetchMock } = await renderBoard({
      cards: [cardA],
      serverCards: () => [cardA, created],
      routes: [{ method: 'POST', path: CARDS_PATH, respond: () => ({ status: 201, body: { card: created } }) }],
    })

    await user.click(screen.getByRole('button', { name: 'Novo card' }))
    await user.type(screen.getByRole('textbox', { name: 'Título' }), 'Configurar CI')
    await user.click(screen.getByRole('button', { name: 'Criar card' }))

    await waitFor(() => expect(readColumn({ name: 'Backlog' })).toEqual(['A', 'Configurar CI']))
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test${CARDS_PATH}`,
      expect.objectContaining({ body: JSON.stringify({ title: 'Configurar CI', description: '' }) }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it.each([
    ['a blank title', '   ', '', 'Informe o título do card.'],
    ['a title of 121 characters', 'a'.repeat(121), '', 'O título deve ter no máximo 120 caracteres.'],
    ['a description of 5001 characters', 'A', 'd'.repeat(5001), 'A descrição deve ter no máximo 5000 caracteres.'],
  ])('rejects %s without calling the API', async (_, title, description, message) => {
    const { user, fetchMock } = await renderBoard({ cards: [] })

    await user.click(screen.getByRole('button', { name: 'Novo card' }))
    await user.type(screen.getByRole('textbox', { name: 'Título' }), title)
    if (description) await user.click(screen.getByRole('textbox', { name: 'Descrição (opcional)' }))
    if (description) await user.paste(description)
    await user.click(screen.getByRole('button', { name: 'Criar card' }))

    expect(screen.getByRole('dialog')).toHaveTextContent(message)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('edit card', () => {
  it('updates title and description, keeping the card in place', async () => {
    const edited = { ...cardC, title: 'C revisado', description: 'detalhes' }
    const { user } = await renderBoard({
      cards: [cardB, cardC],
      serverCards: () => [cardB, edited],
      routes: [{ method: 'PATCH', path: `${CARDS_PATH}/card-c`, respond: () => ({ body: { card: edited } }) }],
    })

    await user.click(screen.getByRole('button', { name: 'Editar C' }))
    await user.clear(screen.getByRole('textbox', { name: 'Título' }))
    await user.type(screen.getByRole('textbox', { name: 'Título' }), 'C revisado')
    await user.type(screen.getByRole('textbox', { name: 'Descrição (opcional)' }), 'detalhes')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(readColumn({ name: 'Propose' })).toEqual(['B', 'C revisado']))
    expect(screen.getByText('detalhes')).toBeInTheDocument()
  })

  it('keeps the card as it was when the new title is blank', async () => {
    const { user, fetchMock } = await renderBoard({ cards: [cardA] })

    await user.click(screen.getByRole('button', { name: 'Editar A' }))
    await user.clear(screen.getByRole('textbox', { name: 'Título' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Informe o título do card.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the server message when saving fails', async () => {
    const failure = { status: 404, body: { code: 'CARD_NOT_FOUND', message: 'Card não encontrado.' } }
    const { user } = await renderBoard({
      cards: [cardA],
      routes: [{ method: 'PATCH', path: `${CARDS_PATH}/card-a`, respond: () => failure }],
    })

    await user.click(screen.getByRole('button', { name: 'Editar A' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Card não encontrado.')
  })
})

describe('delete card', () => {
  it('deletes the card after confirmation, keeping the order of the others', async () => {
    const cardD = buildCard({ id: 'card-d', title: 'D', stage: 'propose', position: 2 })
    const { user } = await renderBoard({
      cards: [cardB, cardC, cardD],
      serverCards: () => [cardB, { ...cardD, position: 1 }],
      routes: [{ method: 'DELETE', path: `${CARDS_PATH}/card-c`, respond: () => ({ status: 204 }) }],
    })

    await user.click(screen.getByRole('button', { name: 'Excluir C' }))
    await user.click(screen.getByRole('button', { name: 'Excluir card' }))

    await waitFor(() => expect(readColumn({ name: 'Propose' })).toEqual(['B', 'D']))
  })

  it('keeps the card when the deletion is cancelled', async () => {
    const { user, fetchMock } = await renderBoard({ cards: [cardB, cardC] })

    await user.click(screen.getByRole('button', { name: 'Excluir C' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(readColumn({ name: 'Propose' })).toEqual(['B', 'C'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the error when the deletion fails', async () => {
    const failure = { status: 500, body: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } }
    const { user } = await renderBoard({
      cards: [cardB],
      routes: [{ method: 'DELETE', path: `${CARDS_PATH}/card-b`, respond: () => failure }],
    })

    await user.click(screen.getByRole('button', { name: 'Excluir B' }))
    await user.click(screen.getByRole('button', { name: 'Excluir card' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Erro interno do servidor.')
  })
})
