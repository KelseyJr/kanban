import { expect, test } from '@playwright/test'
import { createProject } from '../support/api-fixtures'

test.describe('GET /projects', () => {
  test('lists the created projects', async ({ request }) => {
    const { project } = await createProject({ request })

    const response = await request.get('/projects')

    expect(response.status()).toBe(200)
    const { projects } = await response.json()
    expect(projects).toContainEqual(expect.objectContaining({ id: project.id, name: project.name }))
  })

  test('orders the projects alphabetically ignoring capitalization', async ({ request }) => {
    const { project: first } = await createProject({ request })
    const { project: second } = await createProject({ request })

    const { projects } = await (await request.get('/projects')).json()

    const names: string[] = projects.map((project: { name: string }) => project.name.toLowerCase())
    expect(names).toEqual(names.toSorted())
    expect(names).toContain(first.name.toLowerCase())
    expect(names).toContain(second.name.toLowerCase())
  })
})
