import { describe, expect, it } from 'vitest'
import { stubApi } from '@/test/fetch-stub'
import { buildProject } from '@/test/fixtures'
import { createProject, deleteProject, fetchProject, listProjects, renameProject } from './projects.service'

const project = buildProject()

describe('projects API', () => {
  it('lists projects with GET /projects', async () => {
    stubApi({ routes: [{ method: 'GET', path: '/projects', respond: () => ({ body: { projects: [project] } }) }] })

    const { projects } = await listProjects()

    expect(projects).toEqual([project])
  })

  it('fetches one project with GET /projects/:projectId', async () => {
    stubApi({ routes: [{ method: 'GET', path: '/projects/project-1', respond: () => ({ body: { project } }) }] })

    const result = await fetchProject({ projectId: 'project-1' })

    expect(result).toEqual({ project })
  })

  it('creates a project with POST /projects sending the name', async () => {
    const { fetchMock } = stubApi({
      routes: [{ method: 'POST', path: '/projects', respond: () => ({ status: 201, body: { project } }) }],
    })

    const result = await createProject({ name: 'kanban' })

    expect(result).toEqual({ project })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/projects',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'kanban' }) }),
    )
  })

  it('renames a project with PATCH /projects/:projectId sending the name', async () => {
    const renamed = buildProject({ name: 'novo' })
    const { fetchMock } = stubApi({
      routes: [{ method: 'PATCH', path: '/projects/project-1', respond: () => ({ body: { project: renamed } }) }],
    })

    const result = await renameProject({ projectId: 'project-1', name: 'novo' })

    expect(result).toEqual({ project: renamed })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/projects/project-1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ name: 'novo' }) }),
    )
  })

  it('deletes a project with DELETE /projects/:projectId', async () => {
    const { fetchMock } = stubApi({
      routes: [{ method: 'DELETE', path: '/projects/project-1', respond: () => ({ status: 204 }) }],
    })

    await deleteProject({ projectId: 'project-1' })

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/projects/project-1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('rejects a response that does not match the project schema', async () => {
    stubApi({ routes: [{ method: 'GET', path: '/projects', respond: () => ({ body: { projects: [{ id: 1 }] } }) }] })

    await expect(listProjects()).rejects.toMatchObject({ code: 'UNEXPECTED_RESPONSE' })
  })
})
