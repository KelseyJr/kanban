import { describe, expect, it, mock } from 'bun:test'
import { ProjectNotFoundError } from '@/domain/project/project.errors'
import { buildProject, buildProjectsRepository } from '@/test/fixtures'
import { DeleteProjectUseCase } from './delete-project.use-case'

describe('DeleteProjectUseCase', () => {
  it('removes the project through the repository', async () => {
    const project = buildProject()
    const projectsRepository = buildProjectsRepository({ overrides: { remove: mock(async () => ({ project })) } })
    const deleteProjectUseCase = new DeleteProjectUseCase({ projectsRepository })

    await deleteProjectUseCase.execute({ projectId: project.id })

    expect(projectsRepository.remove).toHaveBeenCalledWith({ projectId: project.id })
  })

  it('throws ProjectNotFoundError when the project does not exist', async () => {
    const deleteProjectUseCase = new DeleteProjectUseCase({ projectsRepository: buildProjectsRepository() })

    const execution = deleteProjectUseCase.execute({ projectId: 'missing' })

    await expect(execution).rejects.toBeInstanceOf(ProjectNotFoundError)
  })
})
