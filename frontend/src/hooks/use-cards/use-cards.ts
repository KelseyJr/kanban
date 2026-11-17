import { useSuspenseQuery } from '@tanstack/react-query'
import type { Card } from '@/types/card'
import { cardsQueryOptions } from './cards-queries'

type UseCardsParams = {
  projectId: string
}

type UseCardsResult = {
  cards: Card[]
}

export function useCards({ projectId }: UseCardsParams): UseCardsResult {
  const { data: cards } = useSuspenseQuery(cardsQueryOptions({ projectId }))

  return { cards }
}
