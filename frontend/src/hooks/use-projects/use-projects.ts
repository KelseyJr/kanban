import { useSuspenseQuery } from '@tanstack/react-query'
import type { Project } from '@/types/project'
import { projectsQueryOptions } from './projects-queries'

type UseProjectsResult = {
  projects: Project[]
}

export function useProjects(): UseProjectsResult {
  const { data: projects } = useSuspenseQuery(projectsQueryOptions())

  return { projects }
}
