import { useMutation } from '@tanstack/react-query'
import { updateCard } from '@/services/cards/cards.service'
import { useInvalidateCards } from '@/hooks/use-invalidate-cards/use-invalidate-cards'

type UseUpdateCardParams = {
  projectId: string
}

type UseUpdateCardResult = {
  updateCard: (params: Parameters<typeof updateCard>[0]) => ReturnType<typeof updateCard>
  isPending: boolean
}

export function useUpdateCard({ projectId }: UseUpdateCardParams): UseUpdateCardResult {
  const { invalidateCards } = useInvalidateCards({ projectId })
  const mutation = useMutation({ mutationFn: updateCard, onSettled: invalidateCards })

  return { updateCard: mutation.mutateAsync, isPending: mutation.isPending }
}
