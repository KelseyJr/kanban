import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  type AnyRouter,
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { ReactElement } from 'react'
import type { RouterContext } from '@/routes/__root'

function EmptyPage(): null {
  return null
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

type RenderWithProvidersParams = {
  ui: ReactElement
  initialPath?: string
  queryClient?: QueryClient
}

type RenderWithProvidersResult = {
  user: UserEvent
  queryClient: QueryClient
  getPathname: () => string
}

type CreateTestRouterParams = {
  ui: ReactElement
  initialPath: string
  queryClient: QueryClient
}

function createTestRouter({ ui, initialPath, queryClient }: CreateTestRouterParams): AnyRouter {
  function TestLayout(): ReactElement {
    return (
      <>
        {ui}
        <Outlet />
      </>
    )
  }

  const rootRoute = createRootRouteWithContext<RouterContext>()({ component: TestLayout })
  const anyPathRoute = createRoute({ getParentRoute: () => rootRoute, path: '$', component: EmptyPage })

  return createRouter({
    routeTree: rootRoute.addChildren([anyPathRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: { queryClient },
  })
}

export async function renderWithProviders({
  ui,
  initialPath = '/',
  queryClient = createTestQueryClient(),
}: RenderWithProvidersParams): Promise<RenderWithProvidersResult> {
  const router = createTestRouter({ ui, initialPath, queryClient })
  const user = userEvent.setup()

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  await act(() => router.load())

  function getPathname(): string {
    return router.state.location.pathname
  }

  return { user, queryClient, getPathname }
}
