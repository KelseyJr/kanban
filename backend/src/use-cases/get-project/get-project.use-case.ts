import { ProjectNotFoundError } from '@/domain/project/project.errors'
import type { Project } from '@/domain/project/project.entity'
import type { ProjectsRepository } from '@/domain/project/projects.repository'

type GetProjectUseCaseDependencies = {
  projectsRepository: ProjectsRepository
}

type GetProjectParams = {
  projectId: string
}

type GetProjectResult = {
  project: Project
}

export class GetProjectUseCase {
  private readonly projectsRepository: ProjectsRepository

  constructor({ projectsRepository }: GetProjectUseCaseDependencies) {
    this.projectsRepository = projectsRepository
  }

  async execute({ projectId }: GetProjectParams): Promise<GetProjectResult> {
    const { project } = await this.projectsRepository.findById({ projectId })
    if (!project) throw new ProjectNotFoundError({ projectId })

    return { project }
  }
}
