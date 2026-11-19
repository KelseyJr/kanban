export const E2E_TARGET = {
  local: 'local',
  stack: 'stack',
} as const

export type E2eTarget = (typeof E2E_TARGET)[keyof typeof E2E_TARGET]

type LocalE2eEnv = {
  target: typeof E2E_TARGET.local
  E2E_DATABASE_URL: string
}

type StackE2eEnv = {
  target: typeof E2E_TARGET.stack
  E2E_BASIC_AUTH_USER: string
  E2E_BASIC_AUTH_PASSWORD: string
}

export type E2eEnv = LocalE2eEnv | StackE2eEnv

const REQUIRED_KEYS_BY_TARGET: Record<E2eTarget, readonly string[]> = {
  local: ['E2E_DATABASE_URL'],
  stack: ['E2E_BASIC_AUTH_USER', 'E2E_BASIC_AUTH_PASSWORD'],
}

function loadRootEnvFile(): void {
  try {
    process.loadEnvFile('.env')
  } catch (error: unknown) {
    const isMissingFile = error instanceof Error && 'code' in error && error.code === 'ENOENT'
    if (!isMissingFile) throw error
  }
}

function isE2eTarget(value: string): value is E2eTarget {
  return Object.values<string>(E2E_TARGET).includes(value)
}

type ReadTargetResult = {
  target: E2eTarget
}

function readTarget(): ReadTargetResult {
  const target = process.env.E2E_TARGET ?? E2E_TARGET.local
  if (!isE2eTarget(target)) {
    throw new Error(`Invalid E2E_TARGET "${target}". Use one of: ${Object.values(E2E_TARGET).join(', ')}.`)
  }

  return { target }
}

type ReadRequiredValuesParams = {
  target: E2eTarget
}

type ReadRequiredValuesResult = {
  values: Record<string, string>
}

function readRequiredValues({ target }: ReadRequiredValuesParams): ReadRequiredValuesResult {
  const requiredKeys = REQUIRED_KEYS_BY_TARGET[target]
  const missingKeys = requiredKeys.filter((key) => !process.env[key])
  if (missingKeys.length > 0) {
    throw new Error(
      `Missing E2E environment variables for E2E_TARGET=${target}: ${missingKeys.join(', ')}. See .env.example at the repository root.`,
    )
  }

  return { values: Object.fromEntries(requiredKeys.map((key) => [key, process.env[key] ?? ''])) }
}

type ReadE2eEnvResult = {
  e2eEnv: E2eEnv
}

function readE2eEnv(): ReadE2eEnvResult {
  loadRootEnvFile()
  const { target } = readTarget()
  const { values } = readRequiredValues({ target })

  if (target === E2E_TARGET.stack) {
    const { E2E_BASIC_AUTH_USER = '', E2E_BASIC_AUTH_PASSWORD = '' } = values
    return { e2eEnv: { target, E2E_BASIC_AUTH_USER, E2E_BASIC_AUTH_PASSWORD } }
  }

  return { e2eEnv: { target, E2E_DATABASE_URL: values.E2E_DATABASE_URL ?? '' } }
}

export const { e2eEnv } = readE2eEnv()
