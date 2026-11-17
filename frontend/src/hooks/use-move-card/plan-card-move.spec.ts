import { describe, expect, it } from 'vitest'
import { buildCard } from '@/test/fixtures'
import { type Card, type CardStage, ORDERED_CARD_STAGES } from '@/types/card'
import { planCardMove } from './plan-card-move'

type BoardLayout = Partial<Record<CardStage, string[]>>

type BuildCardsParams = {
  layout: BoardLayout
}

function buildCards({ layout }: BuildCardsParams): Card[] {
  return ORDERED_CARD_STAGES.flatMap((stage) =>
    (layout[stage] ?? []).map((id, position) => buildCard({ id, title: id, stage, position })),
  )
}

type ToLayoutParams = {
  cards: Card[]
}

function toLayout({ cards }: ToLayoutParams): BoardLayout {
  const sorted = cards.toSorted((first, second) => first.position - second.position)
  const columns = ORDERED_CARD_STAGES.map((stage) => ({
    stage,
    ids: sorted.filter((card) => card.stage === stage).map((card) => card.id),
  }))

  return Object.fromEntries(columns.filter(({ ids }) => ids.length > 0).map(({ stage, ids }) => [stage, ids]))
}

type MoveParams = {
  layout: BoardLayout
  cardId: string
  toStage: CardStage
  toPosition: number
}

function move({ layout, cardId, toStage, toPosition }: MoveParams): BoardLayout {
  const { cards } = planCardMove({ cards: buildCards({ layout }), cardId, toStage, toPosition })

  return toLayout({ cards })
}

describe('planCardMove', () => {
  it('moves a card to another column at the chosen position', () => {
    const result = move({ layout: { backlog: ['A', 'B'], explore: ['X'] }, cardId: 'A', toStage: 'explore', toPosition: 1 })

    expect(result).toEqual({ backlog: ['B'], explore: ['X', 'A'] })
  })

  it('skips stages', () => {
    const result = move({ layout: { backlog: ['A'] }, cardId: 'A', toStage: 'propose', toPosition: 0 })

    expect(result).toEqual({ propose: ['A'] })
  })

  it('moves a card back one stage', () => {
    const result = move({ layout: { propose: ['P'], apply: ['A'] }, cardId: 'A', toStage: 'propose', toPosition: 1 })

    expect(result).toEqual({ propose: ['P', 'A'] })
  })

  it('places the card at the end when the position is past the end', () => {
    const result = move({ layout: { backlog: ['A'], apply: ['X', 'Y'] }, cardId: 'A', toStage: 'apply', toPosition: 10 })

    expect(result).toEqual({ apply: ['X', 'Y', 'A'] })
  })

  it('moves a card up to the top of its own column', () => {
    const result = move({ layout: { backlog: ['A', 'B', 'C'] }, cardId: 'C', toStage: 'backlog', toPosition: 0 })

    expect(result).toEqual({ backlog: ['C', 'A', 'B'] })
  })

  it('moves a card down to the end of its own column', () => {
    const result = move({ layout: { backlog: ['A', 'B', 'C'] }, cardId: 'A', toStage: 'backlog', toPosition: 2 })

    expect(result).toEqual({ backlog: ['B', 'C', 'A'] })
  })

  it('keeps the board unchanged when the card stays in the same place', () => {
    const cards = buildCards({ layout: { backlog: ['A', 'B', 'C'] } })

    const result = planCardMove({ cards, cardId: 'B', toStage: 'backlog', toPosition: 1 })

    expect(toLayout({ cards: result.cards })).toEqual({ backlog: ['A', 'B', 'C'] })
  })

  it('leaves both columns numbered from 0 without gaps and other columns untouched', () => {
    const cards = buildCards({ layout: { backlog: ['A', 'B', 'C'], apply: ['X', 'Y'], archive: ['Z'] } })

    const result = planCardMove({ cards, cardId: 'B', toStage: 'apply', toPosition: 1 })

    const positions = result.cards.map(({ id, stage, position }) => ({ id, stage, position }))
    expect(positions).toEqual(
      expect.arrayContaining([
        { id: 'A', stage: 'backlog', position: 0 },
        { id: 'C', stage: 'backlog', position: 1 },
        { id: 'X', stage: 'apply', position: 0 },
        { id: 'B', stage: 'apply', position: 1 },
        { id: 'Y', stage: 'apply', position: 2 },
        { id: 'Z', stage: 'archive', position: 0 },
      ]),
    )
  })

  it('throws when the card is not on the board', () => {
    const cards = buildCards({ layout: { backlog: ['A'] } })

    expect(() => planCardMove({ cards, cardId: 'Z', toStage: 'apply', toPosition: 0 })).toThrow('Z')
  })
})
