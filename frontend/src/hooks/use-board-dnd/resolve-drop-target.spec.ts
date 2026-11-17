import { describe, expect, it } from 'vitest'
import { buildCard } from '@/test/fixtures'
import type { CardsByStage } from './group-cards-by-stage'
import { resolveDropTarget } from './resolve-drop-target'

const cardA = buildCard({ id: 'A', stage: 'backlog', position: 0 })
const cardB = buildCard({ id: 'B', stage: 'backlog', position: 1 })
const cardC = buildCard({ id: 'C', stage: 'backlog', position: 2 })
const cardX = buildCard({ id: 'X', stage: 'explore', position: 0 })

const cardsByStage: CardsByStage = { backlog: [cardA, cardB, cardC], explore: [cardX], propose: [], apply: [], archive: [] }

describe('resolveDropTarget', () => {
  it('drops below a card of another column right after it', () => {
    const target = resolveDropTarget({ activeId: 'A', overId: 'X', isBelowOverCard: true, cardsByStage })

    expect(target).toEqual({ stage: 'explore', position: 1 })
  })

  it('drops above a card of another column right before it', () => {
    const target = resolveDropTarget({ activeId: 'A', overId: 'X', isBelowOverCard: false, cardsByStage })

    expect(target).toEqual({ stage: 'explore', position: 0 })
  })

  it('drops on an empty column at its first position', () => {
    const target = resolveDropTarget({ activeId: 'A', overId: 'propose', isBelowOverCard: false, cardsByStage })

    expect(target).toEqual({ stage: 'propose', position: 0 })
  })

  it('drops on the area of a column at its end', () => {
    const target = resolveDropTarget({ activeId: 'X', overId: 'backlog', isBelowOverCard: false, cardsByStage })

    expect(target).toEqual({ stage: 'backlog', position: 3 })
  })

  it('moves a card to the top of its own column when dropped above the first card', () => {
    const target = resolveDropTarget({ activeId: 'C', overId: 'A', isBelowOverCard: false, cardsByStage })

    expect(target).toEqual({ stage: 'backlog', position: 0 })
  })

  it('moves a card to the end of its own column when dropped below the last card', () => {
    const target = resolveDropTarget({ activeId: 'A', overId: 'C', isBelowOverCard: true, cardsByStage })

    expect(target).toEqual({ stage: 'backlog', position: 2 })
  })

  it.each([
    ['an unknown id', 'unknown'],
    ['the dragged card itself', 'A'],
  ])('returns undefined when dropped over %s', (_, overId) => {
    const target = resolveDropTarget({ activeId: 'A', overId, isBelowOverCard: false, cardsByStage })

    expect(target).toBeUndefined()
  })
})
