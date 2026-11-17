import { CardNotFoundError } from './card.errors'
import type { CardStage } from './card.entity'

export type CardPlacement = {
  id: string
  stage: CardStage
  position: number
}

type PlanCardMoveParams = {
  cards: readonly CardPlacement[]
  cardId: string
  toStage: CardStage
  toPosition: number
}

type PlanCardMoveResult = {
  changes: CardPlacement[]
}

type ListColumnIdsParams = {
  cards: readonly CardPlacement[]
  stage: CardStage
  excludedId: string
}

function listColumnIds({ cards, stage, excludedId }: ListColumnIdsParams): string[] {
  return cards
    .filter((card) => card.stage === stage && card.id !== excludedId)
    .toSorted((first, second) => first.position - second.position)
    .map((card) => card.id)
}

type PlaceColumnParams = {
  ids: readonly string[]
  stage: CardStage
}

function placeColumn({ ids, stage }: PlaceColumnParams): CardPlacement[] {
  return ids.map((id, position) => ({ id, stage, position }))
}

export function planCardMove({ cards, cardId, toStage, toPosition }: PlanCardMoveParams): PlanCardMoveResult {
  const movingCard = cards.find((card) => card.id === cardId)
  if (!movingCard) throw new CardNotFoundError({ cardId })

  const sourceIds = listColumnIds({ cards, stage: movingCard.stage, excludedId: cardId })
  const targetIds = listColumnIds({ cards, stage: toStage, excludedId: cardId })
  const clampedPosition = Math.min(Math.max(toPosition, 0), targetIds.length)
  const placedTarget = placeColumn({ ids: targetIds.toSpliced(clampedPosition, 0, cardId), stage: toStage })
  const placedSource = movingCard.stage === toStage ? [] : placeColumn({ ids: sourceIds, stage: movingCard.stage })

  const changes = [...placedSource, ...placedTarget].filter((placement) => {
    const original = cards.find((card) => card.id === placement.id)
    return original?.stage !== placement.stage || original.position !== placement.position
  })

  return { changes }
}
