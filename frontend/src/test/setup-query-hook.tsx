import type { QueryClient } from '@tanstack/react-query'
import { type MockInstance, vi } from 'vitest'
import { type FetchRoute, stubApi } from './fetch-stub'
import { createQueryWrapper } from './query-wrapper'
import { createTestQueryClient } from './render-with-providers'

type SetupQueryHookParams = {
  routes: FetchRoute[]
}

type SetupQueryHookResult = {
  queryClient: QueryClient
  invalidateQueries: MockInstance<QueryClient['invalidateQueries']>
  wrapper: ReturnType<typeof createQueryWrapper>['wrapper']
}

export function setupQueryHook({ routes }: SetupQueryHookParams): SetupQueryHookResult {
  stubApi({ routes })
  const queryClient = createTestQueryClient()
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const { wrapper } = createQueryWrapper({ queryClient })

  return { queryClient, invalidateQueries, wrapper }
}
