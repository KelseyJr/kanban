import { useQueryClient } from '@tanstack/react-query'
import { PROJECTS_QUERY_KEY } from '@/hooks/use-projects/projects-queries'

type UseInvalidateProjectsResult = {
  invalidateProjects: () => Promise<void>
}

export function useInvalidateProjects(): UseInvalidateProjectsResult {
  const queryClient = useQueryClient()

  async function invalidateProjects(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY })
  }

  return { invalidateProjects }
}
