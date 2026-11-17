import { cors } from '@elysiajs/cors'
import { type AnyElysia, Elysia } from 'elysia'
import type { Logger } from 'pino'
import type { Database } from '@/providers/drizzle/drizzle.client'
import { toErrorResponse } from './error-handler'
import { registerRoutes } from './routes'

const MAX_REQUEST_BODY_SIZE_IN_BYTES = 1024 * 1024

type CreateAppParams = {
  database: Database
  corsOrigin: string
  logger: Logger
}

export function createApp({ database, corsOrigin, logger }: CreateAppParams): AnyElysia {
  const app = new Elysia({ serve: { maxRequestBodySize: MAX_REQUEST_BODY_SIZE_IN_BYTES } })
    .use(cors({ origin: corsOrigin }))
    .onError(({ code, error, set }) => {
      const { status, body } = toErrorResponse({ code, error, logger })
      set.status = status

      return body
    })

  return registerRoutes({ app, database })
}
