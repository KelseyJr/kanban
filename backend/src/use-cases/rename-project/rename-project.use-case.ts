import { ProjectNotFoundError } from '@/domain/project/project.errors'
import type { Project } from '@/domain/project/project.entity'
import type { ProjectsRepository } from '@/domain/project/projects.repository'

type RenameProjectUseCaseDependencies = {
  projectsRepository: ProjectsRepository
}

type RenameProjectParams = {
  projectId: string
  name: string
}

type RenameProjectResult = {
  project: Project
}

export class RenameProjectUseCase {
  private readonly projectsRepository: ProjectsRepository

  constructor({ projectsRepository }: RenameProjectUseCaseDependencies) {
    this.projectsRepository = projectsRepository
  }

  async execute({ projectId, name }: RenameProjectParams): Promise<RenameProjectResult> {
    const { project } = await this.projectsRepository.rename({ projectId, name })
    if (!project) throw new ProjectNotFoundError({ projectId })

    return { project }
  }
}
