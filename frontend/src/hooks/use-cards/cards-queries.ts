import { queryOptions } from '@tanstack/react-query'
import { listCards } from '@/services/cards/cards.service'
import type { SuspenseQueryOptions } from '@/types/suspense-query-options'
import { PROJECTS_QUERY_KEY } from '@/hooks/use-projects/projects-queries'
import type { Card } from '@/types/card'

export type CardsQueryKey = readonly ['projects', string, 'cards']

type CardsQueryOptions = SuspenseQueryOptions<Card[], CardsQueryKey>

type CardsQueryKeyParams = {
  projectId: string
}

export function getCardsQueryKey({ projectId }: CardsQueryKeyParams): CardsQueryKey {
  return [...PROJECTS_QUERY_KEY, projectId, 'cards'] as const
}

export function cardsQueryOptions({ projectId }: CardsQueryKeyParams): CardsQueryOptions {
  return queryOptions({
    queryKey: getCardsQueryKey({ projectId }),
    queryFn: async (): Promise<Card[]> => (await listCards({ projectId })).cards,
  })
}
