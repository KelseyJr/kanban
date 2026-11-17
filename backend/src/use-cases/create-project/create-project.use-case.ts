import type { Project } from '@/domain/project/project.entity'
import type { ProjectsRepository } from '@/domain/project/projects.repository'

type CreateProjectUseCaseDependencies = {
  projectsRepository: ProjectsRepository
}

type CreateProjectParams = {
  name: string
}

type CreateProjectResult = {
  project: Project
}

export class CreateProjectUseCase {
  private readonly projectsRepository: ProjectsRepository

  constructor({ projectsRepository }: CreateProjectUseCaseDependencies) {
    this.projectsRepository = projectsRepository
  }

  async execute({ name }: CreateProjectParams): Promise<CreateProjectResult> {
    return this.projectsRepository.create({ name })
  }
}
