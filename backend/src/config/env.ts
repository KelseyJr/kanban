import { z } from 'zod'

const DEFAULT_PORT = 3333

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  CORS_ORIGIN: z.url(),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

export type Env = z.infer<typeof envSchema>

type ParseEnvParams = {
  source: Record<string, string | undefined>
}

type ParseEnvResult = {
  env: Env
}

export function parseEnv({ source }: ParseEnvParams): ParseEnvResult {
  const result = envSchema.safeParse(source)
  if (!result.success) throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)

  return { env: result.data }
}

export const { env } = parseEnv({ source: Bun.env })
