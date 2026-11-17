import { useMutation } from '@tanstack/react-query'
import { createCard } from '@/services/cards/cards.service'
import { useInvalidateCards } from '@/hooks/use-invalidate-cards/use-invalidate-cards'

type UseCreateCardParams = {
  projectId: string
}

type UseCreateCardResult = {
  createCard: (params: Parameters<typeof createCard>[0]) => ReturnType<typeof createCard>
  isPending: boolean
}

export function useCreateCard({ projectId }: UseCreateCardParams): UseCreateCardResult {
  const { invalidateCards } = useInvalidateCards({ projectId })
  const mutation = useMutation({ mutationFn: createCard, onSettled: invalidateCards })

  return { createCard: mutation.mutateAsync, isPending: mutation.isPending }
}
