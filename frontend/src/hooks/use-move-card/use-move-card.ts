import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { moveCard as requestCardMove } from '@/services/cards/cards.service'
import type { Card, CardStage } from '@/types/card'
import { type CardsQueryKey, getCardsQueryKey } from '@/hooks/use-cards/cards-queries'
import { planCardMove } from './plan-card-move'

export const MOVE_ERROR_MESSAGE = 'Não foi possível mover o card. Tente de novo.'

export type MoveCardParams = {
  cardId: string
  stage: CardStage
  position: number
}

type MoveContext = {
  previousCards: Card[]
}

type MoveCardInCacheParams = {
  queryClient: QueryClient
  queryKey: CardsQueryKey
  cardId: string
  stage: CardStage
  position: number
}

async function moveCardInCache({ queryClient, queryKey, cardId, stage, position }: MoveCardInCacheParams): Promise<MoveContext> {
  await queryClient.cancelQueries({ queryKey })
  const previousCards = queryClient.getQueryData<Card[]>(queryKey) ?? []
  const { cards } = planCardMove({ cards: previousCards, cardId, toStage: stage, toPosition: position })
  queryClient.setQueryData(queryKey, cards)

  return { previousCards }
}

type UseMoveCardParams = {
  projectId: string
}

type UseMoveCardResult = {
  moveCard: (params: MoveCardParams) => void
  errorMessage?: string
  lastMovedCardId?: string
}

export function useMoveCard({ projectId }: UseMoveCardParams): UseMoveCardResult {
  const queryClient = useQueryClient()
  const queryKey = getCardsQueryKey({ projectId })
  const [errorMessage, setErrorMessage] = useState<string>()
  const [lastMovedCardId, setLastMovedCardId] = useState<string>()

  async function applyOptimisticMove(params: MoveCardParams): Promise<MoveContext> {
    setErrorMessage(undefined)
    return moveCardInCache({ queryClient, queryKey, ...params })
  }

  function rollBack(_error: Error, _params: MoveCardParams, context: MoveContext | undefined): void {
    if (context) queryClient.setQueryData(queryKey, context.previousCards)
    setErrorMessage(MOVE_ERROR_MESSAGE)
  }

  const mutation = useMutation({
    mutationFn: (params: MoveCardParams) => requestCardMove({ projectId, ...params }),
    onMutate: applyOptimisticMove,
    onError: rollBack,
    onSuccess: (_result, { cardId }): void => setLastMovedCardId(cardId),
    onSettled: (): Promise<void> => queryClient.invalidateQueries({ queryKey }),
  })

  return { moveCard: mutation.mutate, errorMessage, lastMovedCardId }
}
