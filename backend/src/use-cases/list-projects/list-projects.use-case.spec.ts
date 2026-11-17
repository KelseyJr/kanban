import { describe, expect, it, mock } from 'bun:test'
import { buildProject, buildProjectsRepository } from '@/test/fixtures'
import { ListProjectsUseCase } from './list-projects.use-case'

describe('ListProjectsUseCase', () => {
  it('returns the projects the repository lists', async () => {
    const project = buildProject()
    const projectsRepository = buildProjectsRepository({ overrides: { list: mock(async () => ({ projects: [project] })) } })
    const listProjectsUseCase = new ListProjectsUseCase({ projectsRepository })

    const result = await listProjectsUseCase.execute()

    expect(result).toEqual({ projects: [project] })
  })
})
