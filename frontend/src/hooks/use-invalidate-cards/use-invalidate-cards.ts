import { useQueryClient } from '@tanstack/react-query'
import { getCardsQueryKey } from '@/hooks/use-cards/cards-queries'

type UseInvalidateCardsParams = {
  projectId: string
}

type UseInvalidateCardsResult = {
  invalidateCards: () => Promise<void>
}

export function useInvalidateCards({ projectId }: UseInvalidateCardsParams): UseInvalidateCardsResult {
  const queryClient = useQueryClient()

  async function invalidateCards(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: getCardsQueryKey({ projectId }) })
  }

  return { invalidateCards }
}
