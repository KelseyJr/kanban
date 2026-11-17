import type { AnyElysia } from 'elysia'
import type { Database } from '@/providers/drizzle/drizzle.client'
import { createCardsRoutes } from './routes/cards.routes'
import { createProjectsRoutes } from './routes/projects.routes'

type RegisterRoutesParams = {
  app: AnyElysia
  database: Database
}

export function registerRoutes({ app, database }: RegisterRoutesParams): AnyElysia {
  return app
    .get('/health', () => ({ status: 'ok' }))
    .use(createProjectsRoutes({ database }))
    .use(createCardsRoutes({ database }))
}
