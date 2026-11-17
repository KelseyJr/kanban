import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url(),
})

export type Env = z.infer<typeof envSchema>

type ParseEnvParams = {
  source: Record<string, unknown>
}

type ParseEnvResult = {
  env: Env
}

export function parseEnv({ source }: ParseEnvParams): ParseEnvResult {
  const result = envSchema.safeParse(source)
  if (!result.success) throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)

  return { env: result.data }
}

export const { env } = parseEnv({ source: import.meta.env })
