import { expect, test } from '@playwright/test'
import { createCard, createProject } from '../support/api-fixtures'
import { buildUniqueName } from '../support/build-unique-name'

test.describe('PATCH /projects/:projectId', () => {
  test('renames the project and keeps its cards', async ({ request }) => {
    const { project } = await createProject({ request })
    const { card } = await createCard({ request, projectId: project.id, title: 'A' })
    const { name } = buildUniqueName({ prefix: 'e2e-renomeado' })

    const response = await request.patch(`/projects/${project.id}`, { data: { name } })

    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ project: expect.objectContaining({ id: project.id, name }) })
    const { cards } = await (await request.get(`/projects/${project.id}/cards`)).json()
    expect(cards).toEqual([expect.objectContaining({ id: card.id })])
  })

  test('answers 400 VALIDATION_ERROR for a blank name', async ({ request }) => {
    const { project } = await createProject({ request })

    const response = await request.patch(`/projects/${project.id}`, { data: { name: ' ' } })

    expect(response.status()).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  test('answers 409 PROJECT_NAME_ALREADY_EXISTS for the name of another project', async ({ request }) => {
    const { project: first } = await createProject({ request })
    const { project: second } = await createProject({ request })

    const response = await request.patch(`/projects/${second.id}`, { data: { name: first.name.toUpperCase() } })

    expect(response.status()).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'PROJECT_NAME_ALREADY_EXISTS' })
  })

  test('answers 404 PROJECT_NOT_FOUND for a project that does not exist', async ({ request }) => {
    const response = await request.patch(`/projects/${crypto.randomUUID()}`, { data: { name: 'x' } })

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'PROJECT_NOT_FOUND' })
  })
})
