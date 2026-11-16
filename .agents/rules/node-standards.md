# Node.js Standards

Apply these standards to backend code that runs on Node.js. The paths in the examples mark roles: `src/main/` starts the server, `src/config/env.ts` validates the environment, `src/providers/` talks to databases and external services. In a project with another layout, use its equivalents.

## 1. Async I/O

Write asynchronous code with `async/await` over the promise APIs of the built-in modules (`node:fs/promises`, `node:timers/promises`, `node:stream/promises`). Wrap a callback-only API once with `util.promisify`. Import built-ins with the `node:` prefix.

Instead of:

```ts
import fs from 'fs'

fs.readFile(filePath, 'utf8', (error, content) => {
  if (error) return logger.error(error)
  renderInvoice(content)
})
```

Write:

```ts
import { readFile } from 'node:fs/promises'

async function loadTemplate({ filePath }: LoadTemplateParams): Promise<LoadTemplateResult> {
  const content = await readFile(filePath, 'utf8')

  return { content }
}
```

Start independent operations together with `Promise.all`:

```ts
const [{ user }, { orders }] = await Promise.all([
  usersRepository.findById({ id: userId }),
  ordersRepository.listByUser({ userId }),
])
```

## 2. Keep the event loop free

Node serves every request from one thread, so code that blocks it stalls every other request.

- In the request path, use the async API: `readFile` over `readFileSync`, a promisified `execFile` over `execSync`, `crypto.scrypt` over `scryptSync`. Sync APIs are fine at startup, before the server listens.
- Move CPU-heavy work (image processing, compression, large aggregations) off the event loop: to a worker pool when the request waits for the result, or to a job queue when it can finish later, answering with an id the client polls.
- Bound the work a request can trigger: request body size, page size, and a timeout on every outbound call.

Worker pool with piscina; the worker file sits next to the unit that runs it:

```ts
import Piscina from 'piscina'

const reportPool = new Piscina({
  filename: new URL('./generate-report.worker.ts', import.meta.url).href,
})

export async function generateReport({ orders }: GenerateReportParams): Promise<GenerateReportResult> {
  const { report } = await reportPool.run({ orders })

  return { report }
}
```

Outbound call with a timeout:

```ts
const EXCHANGE_RATE_TIMEOUT_IN_MS = 5000

const response = await fetch(exchangeRateUrl, { signal: AbortSignal.timeout(EXCHANGE_RATE_TIMEOUT_IN_MS) })
```

## 3. Environment

Read the environment in one module, `src/config/env.ts`, that validates it at startup, so a missing variable fails at boot; the rest of the code imports from it. Load `.env` with Node's built-in `--env-file` flag instead of `dotenv`; in production, the platform sets the variables.

```bash
node --env-file=.env src/main/server.ts
```

## 4. Graceful shutdown

`src/main/server.ts` handles `SIGTERM` and `SIGINT`: it stops accepting connections, lets in-flight requests finish within a deadline, closes the resources it opened (database, queues, consumers), and exits. A second signal during shutdown changes nothing.

`src/main/server.ts` (Fastify shown; `app.close()` waits for in-flight requests):

```ts
const SHUTDOWN_TIMEOUT_IN_MS = 10_000

let isShuttingDown = false

async function shutdown({ signal }: ShutdownParams): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true
  app.log.info({ signal }, 'Shutting down')

  const forceExitTimer = setTimeout(() => {
    app.log.error('Shutdown deadline exceeded, forcing exit')
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_IN_MS)
  forceExitTimer.unref()

  await app.close()
  await prisma.$disconnect()
}

process.once('SIGTERM', () => void shutdown({ signal: 'SIGTERM' }))
process.once('SIGINT', () => void shutdown({ signal: 'SIGINT' }))
```

An `uncaughtException` or `unhandledRejection` handler only logs the error and exits with code 1: the process state may be corrupt, and the platform restarts a clean one.

## 5. Logging

Log through one pino logger, created in `src/main/logger.ts` and handed to the framework (`Fastify({ loggerInstance: logger })`), so request logs and app logs share format and request id. `console.*` stays out of the code.

`src/main/logger.ts`:

```ts
import pino from 'pino'
import { env } from '@/config/env'

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
})
```

- Pass context as an object first and the message second: `request.log.info({ orderId, total }, 'Order placed')`.
- Log each failure once, at the edge: the error handler in `src/main/` logs unhandled errors. Inner layers add context and rethrow.
- A unit that handles an error without rethrowing it (a fallback, a retry) receives the logger through its constructor and logs a warning.
- Redact secrets and personal data the log doesn't need: passwords, tokens, keys, documents.

## 6. Dependencies and lock file

- Manage dependencies with npm: `npm install <package>`, `npm install --save-dev <package>`. One package manager per app, so `package-lock.json` is its only lock file.
- Commit `package-lock.json`. In a repository with several apps, each app keeps its own.
- Install in CI with `npm ci`.
- On a lock-file conflict, take the merged `package.json`, run `npm install` to regenerate the lock file, and review the diff.
- Pin the Node version in `.nvmrc` and in `"engines"` in `package.json`.

## 7. Import direction

Imports point one way, from the entry point toward the business core (routes → controllers → use cases → domain), so cycles can't form. A lower layer never imports a higher one. When two modules need each other, move the shared piece (a type, a helper) down to a layer both may import, or inject the collaborator through the constructor from `src/main/`.

Check for cycles after adding imports:

```bash
npx madge --circular --extensions ts --ts-config tsconfig.json src
```

---

Before finishing, check that request-path code uses async APIs, every outbound call has a timeout, logs go through the logger, the server still shuts down gracefully, and madge reports no cycles.
