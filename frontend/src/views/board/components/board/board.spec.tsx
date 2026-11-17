import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { buildCard } from '@/test/fixtures'
import { renderBoard } from '@/test/render-board'

type ReadColumnParams = {
  name: string
}

function readColumn({ name }: ReadColumnParams): string[] {
  const column = screen.getByRole('region', { name })
  return within(column).queryAllByRole('heading', { level: 3 }).map((heading) => heading.textContent ?? '')
}

function readCount({ name }: ReadColumnParams): string | undefined {
  const column = screen.getByRole('region', { name })
  return within(column).getByText('Quantidade:').parentElement?.textContent?.replace('Quantidade:', '').trim()
}

describe('Board', () => {
  it('shows the five columns in order, each with its count, including empty ones', async () => {
    await renderBoard({ cards: [] })

    const names = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)

    expect(names).toEqual(['Backlog', 'Explore', 'Propose', 'Apply', 'Archive'])
    expect(names.map((name) => readCount({ name: name ?? '' }))).toEqual(['0', '0', '0', '0', '0'])
    expect(screen.getAllByText('Nenhum card')).toHaveLength(5)
  })

  it('counts the cards of each column', async () => {
    const cards = [
      buildCard({ id: 'a', title: 'A', stage: 'backlog', position: 0 }),
      buildCard({ id: 'b', title: 'B', stage: 'backlog', position: 1 }),
      buildCard({ id: 'c', title: 'C', stage: 'backlog', position: 2 }),
      buildCard({ id: 'd', title: 'D', stage: 'apply', position: 0 }),
    ]

    await renderBoard({ cards })

    expect(readCount({ name: 'Backlog' })).toBe('3')
    expect(readCount({ name: 'Apply' })).toBe('1')
    expect(readCount({ name: 'Explore' })).toBe('0')
  })

  it('shows the cards of each column in position order with their description', async () => {
    const cards = [
      buildCard({ id: 'b', title: 'B', stage: 'propose', position: 1 }),
      buildCard({ id: 'a', title: 'A', stage: 'propose', position: 0, description: 'detalhes' }),
    ]

    await renderBoard({ cards })

    expect(readColumn({ name: 'Propose' })).toEqual(['A', 'B'])
    expect(screen.getByText('detalhes')).toBeInTheDocument()
  })

  it('shows the project name in the header', async () => {
    await renderBoard({ cards: [] })

    expect(screen.getByRole('navigation', { name: 'Navegação' })).toHaveTextContent('kanban')
  })
})
