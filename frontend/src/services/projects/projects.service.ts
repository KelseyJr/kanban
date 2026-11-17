import { z } from 'zod'
import { type Project, projectSchema } from '@/types/project'
import { requestJson } from '@/services/api.client'

const projectResponseSchema = z.object({ project: projectSchema })
const projectListResponseSchema = z.object({ projects: z.array(projectSchema) })

type ProjectResult = {
  project: Project
}

type ListProjectsResult = {
  projects: Project[]
}

type FetchProjectParams = {
  projectId: string
}

type CreateProjectParams = {
  name: string
}

type RenameProjectParams = {
  projectId: string
  name: string
}

type DeleteProjectParams = {
  projectId: string
}

export async function listProjects(): Promise<ListProjectsResult> {
  const { data } = await requestJson({ path: '/projects', schema: projectListResponseSchema })
  return data
}

export async function fetchProject({ projectId }: FetchProjectParams): Promise<ProjectResult> {
  const { data } = await requestJson({ path: `/projects/${projectId}`, schema: projectResponseSchema })
  return data
}

export async function createProject({ name }: CreateProjectParams): Promise<ProjectResult> {
  const { data } = await requestJson({ path: '/projects', method: 'POST', body: { name }, schema: projectResponseSchema })
  return data
}

export async function renameProject({ projectId, name }: RenameProjectParams): Promise<ProjectResult> {
  const path = `/projects/${projectId}`
  const { data } = await requestJson({ path, method: 'PATCH', body: { name }, schema: projectResponseSchema })
  return data
}

export async function deleteProject({ projectId }: DeleteProjectParams): Promise<void> {
  await requestJson({ path: `/projects/${projectId}`, method: 'DELETE', schema: z.undefined() })
}
