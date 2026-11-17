import { BoardView } from '@/views/board/board.view'
import { getCardsQueryKey } from '@/hooks/use-cards/cards-queries'
import { projectQueryOptions } from '@/hooks/use-projects/projects-queries'
import type { Card } from '@/types/card'
import { type FetchRoute, stubApi } from './fetch-stub'
import { buildProject } from './fixtures'
import { createTestQueryClient, renderWithProviders } from './render-with-providers'

export const BOARD_PROJECT = buildProject({ id: 'project-1', name: 'kanban' })
export const CARDS_PATH = '/projects/project-1/cards'

type RenderBoardParams = {
  cards: Card[]
  serverCards?: () => Card[]
  routes?: FetchRoute[]
}

type RenderedBoard = Awaited<ReturnType<typeof renderWithProviders>>

type FetchMockResult = ReturnType<typeof stubApi>

type RenderBoardResult = RenderedBoard & FetchMockResult

export async function renderBoard({ cards, serverCards = () => cards, routes = [] }: RenderBoardParams): Promise<RenderBoardResult> {
  const listRoute: FetchRoute = { method: 'GET', path: CARDS_PATH, respond: () => ({ body: { cards: serverCards() } }) }
  const { fetchMock } = stubApi({ routes: [...routes, listRoute] })
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(projectQueryOptions({ projectId: BOARD_PROJECT.id }).queryKey, BOARD_PROJECT)
  queryClient.setQueryData(getCardsQueryKey({ projectId: BOARD_PROJECT.id }), cards)
  const rendered = await renderWithProviders({ ui: <BoardView projectId={BOARD_PROJECT.id} />, queryClient })

  return { ...rendered, fetchMock }
}
