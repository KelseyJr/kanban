import type { z } from 'zod'

const FALLBACK_MESSAGE = 'Dados inválidos.'

export type RequestTarget = 'params' | 'body'

type RequestValidationErrorParams = {
  target: RequestTarget
  message: string
}

export class RequestValidationError extends Error {
  override name = 'RequestValidationError'
  readonly target: RequestTarget

  constructor({ target, message }: RequestValidationErrorParams) {
    super(message)
    this.target = target
  }
}

type ValidateRequestParams<T> = {
  schema: z.ZodType<T>
  data: unknown
  target: RequestTarget
}

type ValidateRequestResult<T> = {
  value: T
}

export function validateRequest<T>({ schema, data, target }: ValidateRequestParams<T>): ValidateRequestResult<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new RequestValidationError({ target, message: result.error.issues[0]?.message ?? FALLBACK_MESSAGE })
  }

  return { value: result.data }
}
