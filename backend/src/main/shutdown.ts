import type { Logger } from 'pino'

export type StopServerParams = {
  isForced: boolean
}

type CreateShutdownHandlerParams = {
  stopServer: (params: StopServerParams) => Promise<void>
  closeDatabase: () => Promise<void>
  logger: Logger
  timeoutInMs: number
}

type ShutdownParams = {
  signal: string
}

type CreateShutdownHandlerResult = {
  shutdown: (params: ShutdownParams) => Promise<void>
}

export function createShutdownHandler({
  stopServer,
  closeDatabase,
  logger,
  timeoutInMs,
}: CreateShutdownHandlerParams): CreateShutdownHandlerResult {
  let isShuttingDown = false

  async function shutdown({ signal }: ShutdownParams): Promise<void> {
    if (isShuttingDown) return
    isShuttingDown = true
    logger.info({ signal }, 'Shutting down')

    const forceStopTimer = setTimeout(() => {
      logger.warn({ timeoutInMs }, 'In-flight requests did not finish in time, forcing the server to stop')
      void stopServer({ isForced: true })
    }, timeoutInMs)
    await stopServer({ isForced: false })
    clearTimeout(forceStopTimer)
    await closeDatabase()
    logger.info('Shutdown complete')
  }

  return { shutdown }
}
