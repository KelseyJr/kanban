import { ProjectNotFoundError } from '@/domain/project/project.errors'
import type { ProjectsRepository } from '@/domain/project/projects.repository'

type DeleteProjectUseCaseDependencies = {
  projectsRepository: ProjectsRepository
}

type DeleteProjectParams = {
  projectId: string
}

export class DeleteProjectUseCase {
  private readonly projectsRepository: ProjectsRepository

  constructor({ projectsRepository }: DeleteProjectUseCaseDependencies) {
    this.projectsRepository = projectsRepository
  }

  async execute({ projectId }: DeleteProjectParams): Promise<void> {
    const { project } = await this.projectsRepository.remove({ projectId })
    if (!project) throw new ProjectNotFoundError({ projectId })
  }
}
