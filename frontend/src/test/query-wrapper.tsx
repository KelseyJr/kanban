import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'

type QueryWrapperProps = {
  children: ReactNode
}

type CreateQueryWrapperParams = {
  queryClient: QueryClient
}

type CreateQueryWrapperResult = {
  wrapper: (props: QueryWrapperProps) => ReactElement
}

export function createQueryWrapper({ queryClient }: CreateQueryWrapperParams): CreateQueryWrapperResult {
  function QueryWrapper({ children }: QueryWrapperProps): ReactElement {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return { wrapper: QueryWrapper }
}
