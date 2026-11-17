import { queryOptions } from '@tanstack/react-query'
import { fetchProject, listProjects } from '@/services/projects/projects.service'
import type { SuspenseQueryOptions } from '@/types/suspense-query-options'
import type { Project } from '@/types/project'

export const PROJECTS_QUERY_KEY = ['projects'] as const

type ProjectsQueryKey = typeof PROJECTS_QUERY_KEY
type ProjectQueryKey = readonly [...ProjectsQueryKey, string]

type ProjectsQueryOptions = SuspenseQueryOptions<Project[], ProjectsQueryKey>
type ProjectQueryOptions = SuspenseQueryOptions<Project, ProjectQueryKey>

async function fetchProjectList(): Promise<Project[]> {
  const { projects } = await listProjects()
  return projects
}

export function projectsQueryOptions(): ProjectsQueryOptions {
  return queryOptions({ queryKey: PROJECTS_QUERY_KEY, queryFn: fetchProjectList })
}

type ProjectQueryOptionsParams = {
  projectId: string
}

export function projectQueryOptions({ projectId }: ProjectQueryOptionsParams): ProjectQueryOptions {
  return queryOptions({
    queryKey: [...PROJECTS_QUERY_KEY, projectId] as const,
    queryFn: async (): Promise<Project> => (await fetchProject({ projectId })).project,
  })
}
