import { useMutation } from '@tanstack/react-query'
import { renameProject } from '@/services/projects/projects.service'
import { useInvalidateProjects } from '@/hooks/use-invalidate-projects/use-invalidate-projects'

type UseRenameProjectResult = {
  renameProject: (params: Parameters<typeof renameProject>[0]) => ReturnType<typeof renameProject>
  isPending: boolean
}

export function useRenameProject(): UseRenameProjectResult {
  const { invalidateProjects } = useInvalidateProjects()
  const mutation = useMutation({ mutationFn: renameProject, onSuccess: invalidateProjects })

  return { renameProject: mutation.mutateAsync, isPending: mutation.isPending }
}
