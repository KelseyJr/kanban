import type { Card, CardStage } from '@/types/card'

type PlanCardMoveParams = {
  cards: readonly Card[]
  cardId: string
  toStage: CardStage
  toPosition: number
}

type PlanCardMoveResult = {
  cards: Card[]
}

type ListColumnParams = {
  cards: readonly Card[]
  stage: CardStage
  excludedId: string
}

function listColumn({ cards, stage, excludedId }: ListColumnParams): Card[] {
  return cards
    .filter((card) => card.stage === stage && card.id !== excludedId)
    .toSorted((first, second) => first.position - second.position)
}

type PlaceColumnParams = {
  cards: readonly Card[]
  stage: CardStage
}

function placeColumn({ cards, stage }: PlaceColumnParams): Card[] {
  return cards.map((card, position) => ({ ...card, stage, position }))
}

export function planCardMove({ cards, cardId, toStage, toPosition }: PlanCardMoveParams): PlanCardMoveResult {
  const movingCard = cards.find((card) => card.id === cardId)
  if (!movingCard) throw new Error(`Card ${cardId} não está no quadro.`)

  const target = listColumn({ cards, stage: toStage, excludedId: cardId })
  const clampedPosition = Math.min(Math.max(toPosition, 0), target.length)
  const placedTarget = placeColumn({ cards: target.toSpliced(clampedPosition, 0, movingCard), stage: toStage })
  const touchedStages = new Set<CardStage>([movingCard.stage, toStage])
  const placedSource =
    movingCard.stage === toStage
      ? []
      : placeColumn({ cards: listColumn({ cards, stage: movingCard.stage, excludedId: cardId }), stage: movingCard.stage })
  const untouched = cards.filter((card) => !touchedStages.has(card.stage))

  return { cards: [...untouched, ...placedSource, ...placedTarget] }
}
