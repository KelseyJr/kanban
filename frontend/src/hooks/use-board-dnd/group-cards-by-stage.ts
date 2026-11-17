import type { Card, CardStage } from '@/types/card'

export type CardsByStage = Record<CardStage, Card[]>

type GroupCardsByStageParams = {
  cards: readonly Card[]
}

type GroupCardsByStageResult = {
  cardsByStage: CardsByStage
}

type SelectStageParams = {
  stage: CardStage
}

export function groupCardsByStage({ cards }: GroupCardsByStageParams): GroupCardsByStageResult {
  const sorted = cards.toSorted((first, second) => first.position - second.position)
  const selectStage = ({ stage }: SelectStageParams): Card[] => sorted.filter((card) => card.stage === stage)

  return {
    cardsByStage: {
      backlog: selectStage({ stage: 'backlog' }),
      explore: selectStage({ stage: 'explore' }),
      propose: selectStage({ stage: 'propose' }),
      apply: selectStage({ stage: 'apply' }),
      archive: selectStage({ stage: 'archive' }),
    },
  }
}
