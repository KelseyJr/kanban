import { useSuspenseQuery } from '@tanstack/react-query'
import { projectQueryOptions } from '@/hooks/use-projects/projects-queries'
import type { Project } from '@/types/project'

type UseProjectParams = {
  projectId: string
}

type UseProjectResult = {
  project: Project
}

export function useProject({ projectId }: UseProjectParams): UseProjectResult {
  const { data: project } = useSuspenseQuery(projectQueryOptions({ projectId }))

  return { project }
}
