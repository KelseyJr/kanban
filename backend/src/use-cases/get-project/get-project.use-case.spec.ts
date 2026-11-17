import { describe, expect, it, mock } from 'bun:test'
import { ProjectNotFoundError } from '@/domain/project/project.errors'
import { buildProject, buildProjectsRepository } from '@/test/fixtures'
import { GetProjectUseCase } from './get-project.use-case'

describe('GetProjectUseCase', () => {
  it('returns the project found by id', async () => {
    const project = buildProject()
    const projectsRepository = buildProjectsRepository({ overrides: { findById: mock(async () => ({ project })) } })
    const getProjectUseCase = new GetProjectUseCase({ projectsRepository })

    const result = await getProjectUseCase.execute({ projectId: project.id })

    expect(projectsRepository.findById).toHaveBeenCalledWith({ projectId: project.id })
    expect(result).toEqual({ project })
  })

  it('throws ProjectNotFoundError when the project does not exist', async () => {
    const getProjectUseCase = new GetProjectUseCase({ projectsRepository: buildProjectsRepository() })

    const execution = getProjectUseCase.execute({ projectId: 'missing' })

    await expect(execution).rejects.toBeInstanceOf(ProjectNotFoundError)
  })
})
