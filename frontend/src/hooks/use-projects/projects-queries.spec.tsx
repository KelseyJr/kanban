import { describe, expect, it } from 'vitest'
import { setupQueryHook } from '@/test/setup-query-hook'
import { buildProject } from '@/test/fixtures'
import { projectQueryOptions, projectsQueryOptions } from './projects-queries'

const project = buildProject()

describe('project queries', () => {
  it('loads the project list', async () => {
    const { queryClient } = setupQueryHook({
      routes: [{ method: 'GET', path: '/projects', respond: () => ({ body: { projects: [project] } }) }],
    })

    const projects = await queryClient.fetchQuery(projectsQueryOptions())

    expect(projects).toEqual([project])
  })

  it('loads one project', async () => {
    const { queryClient } = setupQueryHook({
      routes: [{ method: 'GET', path: '/projects/project-1', respond: () => ({ body: { project } }) }],
    })

    const result = await queryClient.fetchQuery(projectQueryOptions({ projectId: 'project-1' }))

    expect(result).toEqual(project)
  })
})
