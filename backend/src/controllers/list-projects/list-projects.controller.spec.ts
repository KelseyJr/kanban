import { describe, expect, it, mock } from 'bun:test'
import { buildProject } from '@/test/fixtures'
import { ListProjectsController } from './list-projects.controller'

describe('ListProjectsController', () => {
  it('answers 200 with the listed projects', async () => {
    const project = buildProject()
    const listProjectsUseCase = { execute: mock(async () => ({ projects: [project] })) }
    const listProjectsController = new ListProjectsController({ listProjectsUseCase })

    const response = await listProjectsController.handle()

    expect(response).toEqual({ statusCode: 200, body: { projects: [project] } })
  })
})
