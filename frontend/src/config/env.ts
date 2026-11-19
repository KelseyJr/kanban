import { createIsomorphicFn } from '@tanstack/react-start'
import { z } from 'zod'

// The browser reaches the API through the app's own origin: the Vite proxy in dev, Caddy in production
export const BROWSER_API_BASE_PATH = '/api'

const serverEnvSchema = z.object({
  API_URL: z.url(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

type ParseServerEnvParams = {
  source: Record<string, unknown>
}

type ParseServerEnvResult = {
  env: ServerEnv
}

export function parseServerEnv({ source }: ParseServerEnvParams): ParseServerEnvResult {
  const result = serverEnvSchema.safeParse(source)
  if (!result.success) throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)

  return { env: result.data }
}

export const getApiBaseUrl = createIsomorphicFn()
  .server(() => parseServerEnv({ source: process.env }).env.API_URL)
  .client(() => BROWSER_API_BASE_PATH)
