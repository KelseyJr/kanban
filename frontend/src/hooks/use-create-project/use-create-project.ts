import { useMutation } from '@tanstack/react-query'
import { createProject } from '@/services/projects/projects.service'
import { useInvalidateProjects } from '@/hooks/use-invalidate-projects/use-invalidate-projects'

type UseCreateProjectResult = {
  createProject: (params: Parameters<typeof createProject>[0]) => ReturnType<typeof createProject>
  isPending: boolean
}

export function useCreateProject(): UseCreateProjectResult {
  const { invalidateProjects } = useInvalidateProjects()
  const mutation = useMutation({ mutationFn: createProject, onSuccess: invalidateProjects })

  return { createProject: mutation.mutateAsync, isPending: mutation.isPending }
}
