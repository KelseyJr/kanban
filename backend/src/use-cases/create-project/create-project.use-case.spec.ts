import { describe, expect, it, mock } from 'bun:test'
import { ProjectNameAlreadyExistsError } from '@/domain/project/project.errors'
import { buildProject, buildProjectsRepository } from '@/test/fixtures'
import { CreateProjectUseCase } from './create-project.use-case'

describe('CreateProjectUseCase', () => {
  it('creates the project through the repository', async () => {
    const project = buildProject({ overrides: { name: 'site' } })
    const projectsRepository = buildProjectsRepository({ overrides: { create: mock(async () => ({ project })) } })
    const createProjectUseCase = new CreateProjectUseCase({ projectsRepository })

    const result = await createProjectUseCase.execute({ name: 'site' })

    expect(projectsRepository.create).toHaveBeenCalledWith({ name: 'site' })
    expect(result).toEqual({ project })
  })

  it('lets ProjectNameAlreadyExistsError propagate when the name is taken', async () => {
    const create = mock(async () => {
      throw new ProjectNameAlreadyExistsError({ name: 'site' })
    })
    const createProjectUseCase = new CreateProjectUseCase({ projectsRepository: buildProjectsRepository({ overrides: { create } }) })

    const execution = createProjectUseCase.execute({ name: 'site' })

    await expect(execution).rejects.toBeInstanceOf(ProjectNameAlreadyExistsError)
  })
})
