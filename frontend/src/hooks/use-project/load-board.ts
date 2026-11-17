import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { isNotFoundError } from '@/services/api-error'
import { projectQueryOptions } from '@/hooks/use-projects/projects-queries'
import { cardsQueryOptions } from '@/hooks/use-cards/cards-queries'

type LoadBoardParams = {
  queryClient: QueryClient
  projectId: string
}

export async function loadBoard({ queryClient, projectId }: LoadBoardParams): Promise<void> {
  const results = await Promise.allSettled([
    queryClient.ensureQueryData(projectQueryOptions({ projectId })),
    queryClient.ensureQueryData(cardsQueryOptions({ projectId })),
  ])
  const failures = results.flatMap((result) => (result.status === 'rejected' ? [result.reason] : []))
  if (failures.some((error: unknown) => isNotFoundError({ error }))) throw notFound()

  const [firstFailure] = failures
  if (firstFailure) throw firstFailure
}
