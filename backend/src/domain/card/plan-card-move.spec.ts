import { describe, expect, it } from 'bun:test'
import { CardNotFoundError } from './card.errors'
import { type CardStage, ORDERED_CARD_STAGES } from './card.entity'
import { type CardPlacement, planCardMove } from './plan-card-move'

type BoardLayout = Partial<Record<CardStage, string[]>>

type BuildCardsParams = {
  layout: BoardLayout
}

function buildCards({ layout }: BuildCardsParams): CardPlacement[] {
  return ORDERED_CARD_STAGES.flatMap((stage) => (layout[stage] ?? []).map((id, position) => ({ id, stage, position })))
}

type ApplyChangesParams = {
  cards: CardPlacement[]
  changes: CardPlacement[]
}

function applyChanges({ cards, changes }: ApplyChangesParams): BoardLayout {
  const merged = cards.map((card) => changes.find((change) => change.id === card.id) ?? card)
  const sorted = merged.toSorted((first, second) => first.position - second.position)

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
  const cards = buildCards({ layout })
  const { changes } = planCardMove({ cards, cardId, toStage, toPosition })

  return applyChanges({ cards, changes })
}

describe('planCardMove', () => {
  it('moves a card to another column at the chosen position', () => {
    const result = move({ layout: { backlog: ['A', 'B'], explore: ['X'] }, cardId: 'A', toStage: 'explore', toPosition: 1 })

    expect(result).toEqual({ backlog: ['B'], explore: ['X', 'A'] })
  })

  it('inserts at the top of another column, shifting its cards down', () => {
    const result = move({ layout: { backlog: ['A'], explore: ['X', 'Y'] }, cardId: 'A', toStage: 'explore', toPosition: 0 })

    expect(result).toEqual({ explore: ['A', 'X', 'Y'] })
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

  it('returns no changes when the card stays in the same place', () => {
    const cards = buildCards({ layout: { backlog: ['A', 'B', 'C'] } })

    const { changes } = planCardMove({ cards, cardId: 'B', toStage: 'backlog', toPosition: 1 })

    expect(changes).toEqual([])
  })

  it('leaves both columns numbered from 0 without gaps', () => {
    const cards = buildCards({ layout: { backlog: ['A', 'B', 'C'], apply: ['X', 'Y'] } })

    const { changes } = planCardMove({ cards, cardId: 'B', toStage: 'apply', toPosition: 1 })

    expect(changes).toEqual([
      { id: 'C', stage: 'backlog', position: 1 },
      { id: 'B', stage: 'apply', position: 1 },
      { id: 'Y', stage: 'apply', position: 2 },
    ])
  })

  it('throws CardNotFoundError when the card is not among the given cards', () => {
    const cards = buildCards({ layout: { backlog: ['A'] } })

    expect(() => planCardMove({ cards, cardId: 'Z', toStage: 'apply', toPosition: 0 })).toThrow(CardNotFoundError)
  })
})
