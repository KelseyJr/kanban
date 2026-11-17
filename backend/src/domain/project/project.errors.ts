type ProjectNotFoundErrorParams = {
  projectId: string
}

export class ProjectNotFoundError extends Error {
  override name = 'ProjectNotFoundError'

  constructor({ projectId }: ProjectNotFoundErrorParams) {
    super(`Project ${projectId} not found`)
  }
}

type ProjectNameAlreadyExistsErrorParams = {
  name: string
  cause?: unknown
}

export class ProjectNameAlreadyExistsError extends Error {
  override name = 'ProjectNameAlreadyExistsError'

  constructor({ name, cause }: ProjectNameAlreadyExistsErrorParams) {
    super(`Project ${name} already exists`, { cause })
  }
}
