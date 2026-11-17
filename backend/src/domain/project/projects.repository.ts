import type { Project } from './project.entity'

export type ListProjectsResult = {
  projects: Project[]
}

export type FindProjectByIdParams = {
  projectId: string
}

export type FindProjectByIdResult = {
  project: Project | null
}

export type CreateProjectParams = {
  name: string
}

export type CreateProjectResult = {
  project: Project
}

export type RenameProjectParams = {
  projectId: string
  name: string
}

export type RenameProjectResult = {
  project: Project | null
}

export type RemoveProjectParams = {
  projectId: string
}

export type RemoveProjectResult = {
  project: Project | null
}

export type ProjectsRepository = {
  list: () => Promise<ListProjectsResult>
  findById: (params: FindProjectByIdParams) => Promise<FindProjectByIdResult>
  create: (params: CreateProjectParams) => Promise<CreateProjectResult>
  rename: (params: RenameProjectParams) => Promise<RenameProjectResult>
  remove: (params: RemoveProjectParams) => Promise<RemoveProjectResult>
}
