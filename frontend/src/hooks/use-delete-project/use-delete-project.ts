import { useMutation } from '@tanstack/react-query'
import { useInvalidateProjects } from '@/hooks/use-invalidate-projects/use-invalidate-projects'
import { describeError } from '@/services/api-error'
import { deleteProject } from '@/services/projects/projects.service'

type DeleteProjectParams = Parameters<typeof deleteProject>[0]

type DeleteProjectResult = {
  errorMessage?: string
}

type UseDeleteProjectResult = {
  deleteProject: (params: DeleteProjectParams) => Promise<DeleteProjectResult>
  isPending: boolean
}

export function useDeleteProject(): UseDeleteProjectResult {
  const { invalidateProjects } = useInvalidateProjects()
  const mutation = useMutation({ mutationFn: deleteProject, onSuccess: invalidateProjects })

  async function deleteExistingProject(params: DeleteProjectParams): Promise<DeleteProjectResult> {
    try {
      await mutation.mutateAsync(params)
      return {}
    } catch (error: unknown) {
      return { errorMessage: describeError({ error }).message }
    }
  }

  return { deleteProject: deleteExistingProject, isPending: mutation.isPending }
}
