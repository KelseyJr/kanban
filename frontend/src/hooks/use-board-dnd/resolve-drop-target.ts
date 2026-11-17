import { type CardStage, ORDERED_CARD_STAGES } from '@/types/card'
import type { CardsByStage } from './group-cards-by-stage'

type ResolveDropTargetParams = {
  activeId: string
  overId: string
  isBelowOverCard: boolean
  cardsByStage: CardsByStage
}

type DropTarget = {
  stage: CardStage
  position: number
}

function isCardStage(value: string): value is CardStage {
  return ORDERED_CARD_STAGES.some((stage) => stage === value)
}

export function resolveDropTarget({ activeId, overId, isBelowOverCard, cardsByStage }: ResolveDropTargetParams): DropTarget | undefined {
  if (isCardStage(overId)) {
    const column = cardsByStage[overId].filter((card) => card.id !== activeId)
    return { stage: overId, position: column.length }
  }

  const overStage = ORDERED_CARD_STAGES.find((stage) => cardsByStage[stage].some((card) => card.id === overId))
  if (!overStage) return undefined

  const column = cardsByStage[overStage].filter((card) => card.id !== activeId)
  const overIndex = column.findIndex((card) => card.id === overId)
  if (overIndex === -1) return undefined

  return { stage: overStage, position: overIndex + (isBelowOverCard ? 1 : 0) }
}
