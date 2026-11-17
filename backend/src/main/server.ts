import { env } from '@/config/env'
import { createDatabase } from '@/providers/drizzle/drizzle.client'
import { createApp } from './app'
import { logger } from './logger'
import { createShutdownHandler } from './shutdown'

const SHUTDOWN_TIMEOUT_IN_MS = 10_000

const { database, closeDatabase } = createDatabase({ url: env.DATABASE_URL })
const app = createApp({ database, corsOrigin: env.CORS_ORIGIN, logger }).listen(env.PORT)
logger.info({ port: env.PORT }, 'API listening')

const { shutdown } = createShutdownHandler({
  stopServer: async ({ isForced }): Promise<void> => {
    await app.stop(isForced)
  },
  closeDatabase,
  logger,
  timeoutInMs: SHUTDOWN_TIMEOUT_IN_MS,
})

process.once('SIGTERM', () => void shutdown({ signal: 'SIGTERM' }))
process.once('SIGINT', () => void shutdown({ signal: 'SIGINT' }))
