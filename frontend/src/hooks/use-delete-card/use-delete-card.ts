import { useMutation } from '@tanstack/react-query'
import { useInvalidateCards } from '@/hooks/use-invalidate-cards/use-invalidate-cards'
import { describeError } from '@/services/api-error'
import { deleteCard } from '@/services/cards/cards.service'

type UseDeleteCardParams = {
  projectId: string
}

type DeleteCardParams = Parameters<typeof deleteCard>[0]

type DeleteCardResult = {
  errorMessage?: string
}

type UseDeleteCardResult = {
  deleteCard: (params: DeleteCardParams) => Promise<DeleteCardResult>
  isPending: boolean
}

export function useDeleteCard({ projectId }: UseDeleteCardParams): UseDeleteCardResult {
  const { invalidateCards } = useInvalidateCards({ projectId })
  const mutation = useMutation({ mutationFn: deleteCard, onSettled: invalidateCards })

  async function deleteExistingCard(params: DeleteCardParams): Promise<DeleteCardResult> {
    try {
      await mutation.mutateAsync(params)
      return {}
    } catch (error: unknown) {
      return { errorMessage: describeError({ error }).message }
    }
  }

  return { deleteCard: deleteExistingCard, isPending: mutation.isPending }
}
