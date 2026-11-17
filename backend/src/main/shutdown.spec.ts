import { describe, expect, it, mock } from 'bun:test'
import pino from 'pino'
import { createShutdownHandler, type StopServerParams } from './shutdown'

const TIMEOUT_IN_MS = 20

function createSilentLogger(): pino.Logger {
  return pino({ level: 'silent' })
}

describe('createShutdownHandler', () => {
  it('stops the server gracefully and then closes the database', async () => {
    const calls: string[] = []
    const stopServer = mock(async () => void calls.push('stopServer'))
    const closeDatabase = mock(async () => void calls.push('closeDatabase'))
    const { shutdown } = createShutdownHandler({
      stopServer,
      closeDatabase,
      logger: createSilentLogger(),
      timeoutInMs: TIMEOUT_IN_MS,
    })

    await shutdown({ signal: 'SIGTERM' })

    expect(calls).toEqual(['stopServer', 'closeDatabase'])
    expect(stopServer).toHaveBeenCalledWith({ isForced: false })
  })

  it('ignores a second signal while shutting down', async () => {
    const stopServer = mock(async () => {})
    const closeDatabase = mock(async () => {})
    const { shutdown } = createShutdownHandler({
      stopServer,
      closeDatabase,
      logger: createSilentLogger(),
      timeoutInMs: TIMEOUT_IN_MS,
    })

    await Promise.all([shutdown({ signal: 'SIGTERM' }), shutdown({ signal: 'SIGINT' })])

    expect(stopServer).toHaveBeenCalledTimes(1)
    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })

  it('forces the server to stop when in-flight requests outlast the deadline', async () => {
    const { promise: gracefulStop, resolve: finishGracefulStop } = Promise.withResolvers<void>()
    const stopServer = mock(async ({ isForced }: StopServerParams) => {
      if (isForced) return finishGracefulStop()
      await gracefulStop
    })
    const closeDatabase = mock(async () => {})
    const { shutdown } = createShutdownHandler({
      stopServer,
      closeDatabase,
      logger: createSilentLogger(),
      timeoutInMs: TIMEOUT_IN_MS,
    })

    await shutdown({ signal: 'SIGTERM' })

    expect(stopServer).toHaveBeenCalledWith({ isForced: true })
    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })
})
