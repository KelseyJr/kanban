import type { Active, DragEndEvent, Over } from '@dnd-kit/core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, type Mock, vi } from 'vitest'
import { buildCard } from '@/test/fixtures'
import { groupCardsByStage } from './group-cards-by-stage'
import { useBoardDnd } from './use-board-dnd'
import type { MoveCardParams } from '@/hooks/use-move-card/use-move-card'

const cardA = buildCard({ id: 'A', title: 'A', stage: 'backlog', position: 0 })
const cardB = buildCard({ id: 'B', title: 'B', stage: 'backlog', position: 1 })
const cardX = buildCard({ id: 'X', title: 'X', stage: 'explore', position: 0 })
const cards = [cardA, cardB, cardX]
const OVER_RECT = { top: 100, height: 40, left: 0, width: 200, bottom: 140, right: 200 }

type BuildDragEndParams = {
  activeId: string
  overId?: string
  translatedTop?: number
}

function buildDragEnd({ activeId, overId, translatedTop }: BuildDragEndParams): DragEndEvent {
  const translated = translatedTop === undefined ? null : { ...OVER_RECT, top: translatedTop }
  const active: Active = { id: activeId, data: { current: undefined }, rect: { current: { initial: null, translated } } }
  const over: Over | null = overId ? { id: overId, rect: OVER_RECT, disabled: false, data: { current: undefined } } : null

  return { active, over, activatorEvent: new Event('pointerdown'), collisions: null, delta: { x: 0, y: 0 } }
}

type RenderDndResult = {
  moveCard: Mock<(params: MoveCardParams) => void>
  result: { current: ReturnType<typeof useBoardDnd> }
}

function renderDnd(): RenderDndResult {
  const moveCard = vi.fn<(params: MoveCardParams) => void>()
  const { cardsByStage } = groupCardsByStage({ cards })
  const { result } = renderHook(() => useBoardDnd({ cards, cardsByStage, moveCard }))

  return { moveCard, result }
}

describe('useBoardDnd', () => {
  it('moves a card dropped below a card of another column to right after it', () => {
    const { moveCard, result } = renderDnd()

    act(() => result.current.handleDragEnd(buildDragEnd({ activeId: 'A', overId: 'X', translatedTop: 130 })))

    expect(moveCard).toHaveBeenCalledWith({ cardId: 'A', stage: 'explore', position: 1 })
  })

  it('moves a card dropped above a card of its own column to before it', () => {
    const { moveCard, result } = renderDnd()

    act(() => result.current.handleDragEnd(buildDragEnd({ activeId: 'B', overId: 'A', translatedTop: 90 })))

    expect(moveCard).toHaveBeenCalledWith({ cardId: 'B', stage: 'backlog', position: 0 })
  })

  it('moves a card dropped on an empty column to its first position', () => {
    const { moveCard, result } = renderDnd()

    act(() => result.current.handleDragEnd(buildDragEnd({ activeId: 'A', overId: 'archive' })))

    expect(moveCard).toHaveBeenCalledWith({ cardId: 'A', stage: 'archive', position: 0 })
  })

  it.each([
    { place: 'outside the board', overId: undefined },
    { place: 'back on its own place', overId: 'backlog' },
    { place: 'over itself', overId: 'B' },
  ])('does not move a card dropped $place', ({ overId }) => {
    const { moveCard, result } = renderDnd()

    act(() => result.current.handleDragEnd(buildDragEnd({ activeId: 'B', overId })))

    expect(moveCard).not.toHaveBeenCalled()
  })

  it('tracks the dragged card until the drag ends or is cancelled', () => {
    const { result } = renderDnd()

    act(() => result.current.handleDragStart(buildDragEnd({ activeId: 'X' })))
    expect(result.current.activeCard).toEqual(cardX)

    act(() => result.current.handleDragCancel())
    expect(result.current.activeCard).toBeUndefined()
  })

  it('announces the drag in Portuguese', () => {
    const { result } = renderDnd()
    const { active, over } = buildDragEnd({ activeId: 'A', overId: 'explore' })
    const event = { active, over }

    expect(result.current.announcements.onDragStart({ active })).toBe('Card A pego.')
    expect(result.current.announcements.onDragOver(event)).toBe('Card A sobre a coluna Explore.')
    expect(result.current.announcements.onDragEnd({ active, over: buildDragEnd({ activeId: 'A', overId: 'X' }).over })).toBe(
      'Card A solto sobre o card X em Explore.',
    )
    expect(result.current.announcements.onDragEnd({ active, over: null })).toBe('Card A solto fora do quadro.')
    expect(result.current.announcements.onDragCancel({ active, over: null })).toBe('Movimento do card A cancelado.')
  })
})
