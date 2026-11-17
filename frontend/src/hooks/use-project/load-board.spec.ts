import { isNotFound } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { getCardsQueryKey } from '@/hooks/use-cards/cards-queries'
import { projectQueryOptions } from '@/hooks/use-projects/projects-queries'
import { stubApi } from '@/test/fetch-stub'
import { buildCard, buildProject } from '@/test/fixtures'
import { createTestQueryClient } from '@/test/render-with-providers'
import { loadBoard } from './load-board'

const NOT_FOUND = { status: 404, body: { code: 'PROJECT_NOT_FOUND', message: 'Projeto não encontrado.' } }

describe('loadBoard', () => {
  it('loads the project and its cards into the cache', async () => {
    const project = buildProject()
    const card = buildCard()
    stubApi({
      routes: [
        { method: 'GET', path: '/projects/project-1', respond: () => ({ body: { project } }) },
        { method: 'GET', path: '/projects/project-1/cards', respond: () => ({ body: { cards: [card] } }) },
      ],
    })
    const queryClient = createTestQueryClient()

    await loadBoard({ queryClient, projectId: 'project-1' })

    expect(queryClient.getQueryData(projectQueryOptions({ projectId: 'project-1' }).queryKey)).toEqual(project)
    expect(queryClient.getQueryData(getCardsQueryKey({ projectId: 'project-1' }))).toEqual([card])
  })

  it('throws the router notFound when the API answers 404', async () => {
    stubApi({
      routes: [
        { method: 'GET', path: '/projects/gone', respond: () => NOT_FOUND },
        { method: 'GET', path: '/projects/gone/cards', respond: () => NOT_FOUND },
      ],
    })

    const loading = loadBoard({ queryClient: createTestQueryClient(), projectId: 'gone' })

    await expect(loading.catch((error: unknown) => isNotFound(error))).resolves.toBe(true)
  })

  it('rethrows other errors', async () => {
    const failure = { status: 500, body: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } }
    stubApi({
      routes: [
        { method: 'GET', path: '/projects/p', respond: () => failure },
        { method: 'GET', path: '/projects/p/cards', respond: () => failure },
      ],
    })

    const loading = loadBoard({ queryClient: createTestQueryClient(), projectId: 'p' })

    await expect(loading).rejects.toMatchObject({ status: 500 })
  })
})
