const REQUIRED_KEYS = ['E2E_DATABASE_URL'] as const

type E2eEnv = Record<(typeof REQUIRED_KEYS)[number], string>

function loadRootEnvFile(): void {
  try {
    process.loadEnvFile('.env')
  } catch (error: unknown) {
    const isMissingFile = error instanceof Error && 'code' in error && error.code === 'ENOENT'
    if (!isMissingFile) throw error
  }
}

type ReadE2eEnvResult = {
  e2eEnv: E2eEnv
}

function readE2eEnv(): ReadE2eEnvResult {
  loadRootEnvFile()
  const missingKeys = REQUIRED_KEYS.filter((key) => !process.env[key])
  if (missingKeys.length > 0) {
    throw new Error(`Missing E2E environment variables: ${missingKeys.join(', ')}. Copy .env.example to .env at the repository root.`)
  }

  return { e2eEnv: { E2E_DATABASE_URL: process.env.E2E_DATABASE_URL ?? '' } }
}

export const { e2eEnv } = readE2eEnv()
