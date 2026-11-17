const UNIQUE_VIOLATION_CODE = '23505'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

type IsUniqueViolationParams = {
  error: unknown
}

export function isUniqueViolation({ error }: IsUniqueViolationParams): boolean {
  if (!(error instanceof Error) || !isRecord(error.cause)) return false

  return error.cause.errno === UNIQUE_VIOLATION_CODE
}
