import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { buildCard } from '@/test/fixtures'
import { CARDS_PATH, renderBoard } from '@/test/render-board'

const cardA = buildCard({ id: 'card-a', title: 'A', stage: 'backlog', position: 0 })
const cardX = buildCard({ id: 'card-x', title: 'X', stage: 'apply', position: 0 })

type ReadColumnParams = {
  name: string
}

function readColumn({ name }: ReadColumnParams): string[] {
  const column = screen.getByRole('region', { name })
  return within(column).queryAllByRole('heading', { level: 3 }).map((heading) => heading.textContent ?? '')
}

describe('MoveCardMenu', () => {
  it('moves a card to the end of the chosen column using only the keyboard', async () => {
    const movedA = { ...cardA, stage: 'apply' as const, position: 1 }
    const { user, fetchMock } = await renderBoard({
      cards: [cardA, cardX],
      serverCards: () => [cardX, movedA],
      routes: [{ method: 'POST', path: `${CARDS_PATH}/card-a/move`, respond: () => ({ body: { card: movedA } }) }],
    })

    screen.getByRole('button', { name: 'Mover para: A' }).focus()
    await user.keyboard('{Enter}')
    await user.tab()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus()
    await user.keyboard('{Enter}')

    await waitFor(() => expect(readColumn({ name: 'Apply' })).toEqual(['X', 'A']))
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test${CARDS_PATH}/card-a/move`,
      expect.objectContaining({ body: JSON.stringify({ stage: 'apply', position: 1 }) }),
    )
  })

  it('offers the four other columns, never the current one', async () => {
    const cardInExplore = buildCard({ id: 'card-e', title: 'E', stage: 'explore', position: 0 })
    const { user } = await renderBoard({ cards: [cardInExplore] })

    await user.click(screen.getByRole('button', { name: 'Mover para: E' }))

    const options = within(screen.getByRole('list', { name: 'Colunas de destino' })).queryAllByRole('button')
    expect(screen.getByRole('button', { name: 'Mover para: E' })).toHaveAttribute('aria-expanded', 'true')
    expect(options.map((option) => option.textContent)).toEqual(['Backlog', 'Propose', 'Apply', 'Archive'])
  })

  it('closes the menu with Escape', async () => {
    const { user } = await renderBoard({ cards: [cardA] })

    await user.click(screen.getByRole('button', { name: 'Mover para: A' }))
    await user.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Mover para: A' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('puts the card back and shows an alert when the move fails', async () => {
    const failure = { status: 500, body: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } }
    const { user } = await renderBoard({
      cards: [cardA, buildCard({ id: 'card-b', title: 'B', stage: 'backlog', position: 1 })],
      routes: [{ method: 'POST', path: `${CARDS_PATH}/card-a/move`, respond: () => failure }],
    })

    await user.click(screen.getByRole('button', { name: 'Mover para: A' }))
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByText('Não foi possível mover o card. Tente de novo.')).toBeInTheDocument()
    expect(readColumn({ name: 'Backlog' })).toEqual(['A', 'B'])
    expect(readColumn({ name: 'Apply' })).toEqual([])
  })

  it('marks the moved card with a postmark of its new column', async () => {
    const movedA = { ...cardA, stage: 'archive' as const, position: 0 }
    const { user } = await renderBoard({
      cards: [cardA],
      serverCards: () => [movedA],
      routes: [{ method: 'POST', path: `${CARDS_PATH}/card-a/move`, respond: () => ({ body: { card: movedA } }) }],
    })

    await user.click(screen.getByRole('button', { name: 'Mover para: A' }))
    await user.click(screen.getByRole('button', { name: 'Archive' }))

    const column = screen.getByRole('region', { name: 'Archive' })
    expect(await within(column).findByText(/Movido agora para/)).toBeInTheDocument()
  })
})
