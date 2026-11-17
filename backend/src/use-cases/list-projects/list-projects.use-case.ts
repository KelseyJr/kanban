import type { ListProjectsResult, ProjectsRepository } from '@/domain/project/projects.repository'

type ListProjectsUseCaseDependencies = {
  projectsRepository: ProjectsRepository
}

export class ListProjectsUseCase {
  private readonly projectsRepository: ProjectsRepository

  constructor({ projectsRepository }: ListProjectsUseCaseDependencies) {
    this.projectsRepository = projectsRepository
  }

  async execute(): Promise<ListProjectsResult> {
    return this.projectsRepository.list()
  }
}
