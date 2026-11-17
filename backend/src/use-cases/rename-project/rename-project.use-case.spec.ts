import { describe, expect, it, mock } from 'bun:test'
import { ProjectNotFoundError } from '@/domain/project/project.errors'
import { buildProject, buildProjectsRepository } from '@/test/fixtures'
import { RenameProjectUseCase } from './rename-project.use-case'

describe('RenameProjectUseCase', () => {
  it('renames the project through the repository', async () => {
    const project = buildProject({ overrides: { name: 'kanban-app' } })
    const projectsRepository = buildProjectsRepository({ overrides: { rename: mock(async () => ({ project })) } })
    const renameProjectUseCase = new RenameProjectUseCase({ projectsRepository })

    const result = await renameProjectUseCase.execute({ projectId: project.id, name: 'kanban-app' })

    expect(projectsRepository.rename).toHaveBeenCalledWith({ projectId: project.id, name: 'kanban-app' })
    expect(result).toEqual({ project })
  })

  it('throws ProjectNotFoundError when the project does not exist', async () => {
    const renameProjectUseCase = new RenameProjectUseCase({ projectsRepository: buildProjectsRepository() })

    const execution = renameProjectUseCase.execute({ projectId: 'missing', name: 'x' })

    await expect(execution).rejects.toBeInstanceOf(ProjectNotFoundError)
  })
})
