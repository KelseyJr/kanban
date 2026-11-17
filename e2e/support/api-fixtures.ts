import { type APIRequestContext, expect } from '@playwright/test'
import { E2E_API_URL } from './urls'
import { buildUniqueName } from './build-unique-name'

type ApiParams = {
  request: APIRequestContext
}

type CreatedProject = {
  id: string
  name: string
}

type CreateProjectResult = {
  project: CreatedProject
}

export async function createProject({ request }: ApiParams): Promise<CreateProjectResult> {
  const { name } = buildUniqueName({ prefix: 'e2e-projeto' })
  const response = await request.post(`${E2E_API_URL}/projects`, { data: { name } })
  expect(response.status()).toBe(201)
  const { project } = await response.json()

  return { project }
}

type CreateCardParams = ApiParams & {
  projectId: string
  title: string
}

type CreatedCard = {
  id: string
  title: string
  stage: string
  position: number
}

type CreateCardResult = {
  card: CreatedCard
}

export async function createCard({ request, projectId, title }: CreateCardParams): Promise<CreateCardResult> {
  const response = await request.post(`${E2E_API_URL}/projects/${projectId}/cards`, { data: { title } })
  expect(response.status()).toBe(201)
  const { card } = await response.json()

  return { card }
}
