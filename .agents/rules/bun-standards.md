# Bun Standards

Apply these standards to backend code that runs on Bun. The paths in the examples mark roles: `src/main/` starts the server, `src/config/env.ts` validates the environment, `src/providers/` talks to databases and external services. In a project with another layout, use its equivalents.

## 1. Async I/O and built-in APIs

Write asynchronous code with `async/await`. Reach for Bun's built-ins first, and add a package for the same job only when the project already depends on it:

| Job                     | Bun built-in                            | Instead of                   |
| ----------------------- | --------------------------------------- | ---------------------------- |
| Run TypeScript          | `bun src/main/server.ts`                | `tsx`, `ts-node`, build step |
| Load `.env`             | automatic (section 3)                   | `dotenv`                     |
| Read and write files    | `Bun.file(path).text()`, `Bun.write()`  | `node:fs/promises`           |
| Hash passwords          | `Bun.password.hash()`, `verify()`       | `bcrypt`, `argon2`           |
| Run tests               | `bun test` with `bun:test` (section 8)  | Vitest, Jest                 |
| Type check              | `bun check`                             | `tsc --noEmit`               |
| Run a package's binary  | `bunx`                                  | `npx`                        |

```ts
async function hashPassword({ password }: HashPasswordParams): Promise<HashPasswordResult> {
  const passwordHash = await Bun.password.hash(password)

  return { passwordHash }
}
```

Node built-ins (`node:crypto`, `node:worker_threads`) work too; import them with the `node:` prefix. Start independent operations together with `Promise.all`.

## 2. Keep the event loop free

Bun serves every request from one thread, like Node.

- In the request path, use async APIs; sync APIs are fine at startup, before the server listens.
- Move CPU-heavy work off the event loop: to a worker when the request waits for the result (`node:worker_threads` runs `.ts` worker files directly), or to a job queue when it can finish later.
- Bound the work a request can trigger: request body size, page size, and a timeout on every outbound call (`fetch(url, { signal: AbortSignal.timeout(TIMEOUT_IN_MS) })`).
- `Bun.serve` drops a connection after 10 seconds without sending bytes (`idleTimeout`). Raise `idleTimeout` (in seconds, at most 255) for slow endpoints, or move the work to a queue.

## 3. Environment

Bun loads `.env`, `.env.<NODE_ENV>` and `.env.local` by itself, so the project has no `dotenv` and no `--env-file` flag. Read the environment in one module, `src/config/env.ts`, that validates it at startup, so a missing variable fails at boot; the rest of the code imports from it.

- `bun test` sets `NODE_ENV=test` and loads `.env.test`: keep the test database URL there.
- In production, run with `--no-env-file`, so only the platform's variables apply: `bun --no-env-file src/main/server.ts`.

## 4. Graceful shutdown

`src/main/server.ts` handles `SIGTERM` and `SIGINT`: it stops accepting connections, lets in-flight requests finish within a deadline, closes the resources it opened, and exits. A second signal during shutdown changes nothing.

With `Bun.serve`, `await server.stop()` waits for in-flight requests; `server.stop(true)` cuts every connection, so it is only the deadline fallback:

```ts
const SHUTDOWN_TIMEOUT_IN_MS = 10_000

let isShuttingDown = false

async function shutdown({ signal }: ShutdownParams): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true
  logger.info({ signal }, 'Shutting down')

  const forceStopTimer = setTimeout(() => void server.stop(true), SHUTDOWN_TIMEOUT_IN_MS)
  await server.stop()
  clearTimeout(forceStopTimer)
  await prisma.$disconnect()
}

process.once('SIGTERM', () => void shutdown({ signal: 'SIGTERM' }))
process.once('SIGINT', () => void shutdown({ signal: 'SIGINT' }))
```

A framework that runs its own server closes through its own method in the same handler: `await app.close()` in Fastify, `await app.stop()` in Elysia.

## 5. Logging

Log through one pino logger, created in `src/main/logger.ts`. `console.*` stays out of the code.

`src/main/logger.ts`:

```ts
import pino from 'pino'
import { env } from '@/config/env'

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
})
```

- Pass context as an object first and the message second: `logger.info({ orderId, total }, 'Order placed')`.
- Log each failure once, at the edge: the error handler in `src/main/` logs unhandled errors. Inner layers add context and rethrow.
- A unit that handles an error without rethrowing it (a fallback, a retry) receives the logger through its constructor and logs a warning.
- Redact secrets and personal data the log doesn't need: passwords, tokens, keys, documents.

## 6. Dependencies and lock file

- Manage dependencies with Bun: `bun add <package>`, `bun add -d <package>`. One package manager per app, so `bun.lock` is its only lock file.
- Commit `bun.lock`, the text lock file. A project still on the binary `bun.lockb` converts with `bun install --save-text-lockfile --frozen-lockfile --lockfile-only`, then deletes `bun.lockb`.
- Install in CI with `bun ci`, which fails when `package.json` and `bun.lock` disagree.
- Bun skips the install scripts of dependencies outside its default trusted list. When a package needs its `postinstall` (native binaries), add it to `"trustedDependencies"` in `package.json`; that field replaces the default list, so list every package that needs its scripts.
- Gate fresh releases in `bunfig.toml`, so a hijacked version has time to be caught before it reaches the project:

```toml
[install]
minimumReleaseAge = 259200 # 3 days, in seconds
```

- Check for known vulnerabilities with `bun audit`.

## 7. Import direction

Imports point one way, from the entry point toward the business core (routes → controllers → use cases → domain), so cycles can't form. A lower layer never imports a higher one. When two modules need each other, move the shared piece (a type, a helper) down to a layer both may import, or inject the collaborator through the constructor from `src/main/`.

Check for cycles after adding imports:

```bash
bunx madge --circular --extensions ts --ts-config tsconfig.json src
```

## 8. Tests

Bun projects run unit and E2E specs with `bun test`, importing from `bun:test` (`describe`, `it`, `expect`, `mock`, `spyOn`, `setSystemTime`). The runner is configured in `bunfig.toml`, with no Vitest config; unit specs sit in `src/` and E2E specs in `e2e/` as `<flow>.e2e-spec.ts`:

```toml
[test]
root = "src"
coverage = true
coverageThreshold = 0.8
coverageSkipTestFiles = true
restoreMocks = true
```

```json
{
  "scripts": {
    "test": "bun test",
    "test:e2e": "bun test ./e2e/*.e2e-spec.ts"
  }
}
```

- `root = "src"` keeps E2E specs out of the unit run. `bun test` only discovers `.test`/`.spec` names, so `.e2e-spec.ts` files run through the explicit paths in `test:e2e`.
- `bun test` always starts Bun's runner and ignores the `test` script; run project scripts with `bun run <script>`.

## 9. TypeScript and checks

- Install `@types/bun` as a dev dependency and keep the `tsconfig.json` that `bun init` generates (`"types": ["bun"]`, `"moduleResolution": "bundler"`, `"noEmit": true`, `"strict": true`).
- After changing code, run the checks through Bun: `bun run lint`, `bun run typecheck` (or `bun check` when no script exists) and `bun run test`, and fix every error the change introduced.

---

Before finishing, check that request-path code uses async APIs, every outbound call has a timeout, the server still shuts down gracefully, dependencies changed through `bun add` with `bun.lock` updated, and the checks in section 9 pass.
