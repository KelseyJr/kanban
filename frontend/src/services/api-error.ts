export const CLIENT_ERROR_CODE = {
  network: 'NETWORK_ERROR',
  timeout: 'TIMEOUT',
  unexpectedResponse: 'UNEXPECTED_RESPONSE',
} as const

const ERROR_MESSAGES: Record<string, string> = {
  PROJECT_NOT_FOUND: 'Projeto não encontrado.',
  CARD_NOT_FOUND: 'Card não encontrado.',
  NOT_FOUND: 'Recurso não encontrado.',
  PROJECT_NAME_ALREADY_EXISTS: 'Já existe um projeto com esse nome.',
  VALIDATION_ERROR: 'Confira os dados informados.',
  INTERNAL_ERROR: 'Erro interno do servidor. Tente de novo.',
  [CLIENT_ERROR_CODE.network]: 'Não foi possível falar com o servidor.',
  [CLIENT_ERROR_CODE.timeout]: 'O servidor demorou demais para responder.',
  [CLIENT_ERROR_CODE.unexpectedResponse]: 'O servidor respondeu de um jeito inesperado.',
}

const FALLBACK_ERROR_MESSAGE = 'Algo deu errado. Tente de novo.'

type ApiErrorParams = {
  status: number
  code: string
  message: string
  cause?: unknown
}

export class ApiError extends Error {
  override name = 'ApiError'
  readonly status: number
  readonly code: string

  constructor({ status, code, message, cause }: ApiErrorParams) {
    super(message, { cause })
    this.status = status
    this.code = code
  }
}

export const HTTP_NOT_FOUND = 404

type IsNotFoundErrorParams = {
  error: unknown
}

export function isNotFoundError({ error }: IsNotFoundErrorParams): boolean {
  return error instanceof ApiError && error.status === HTTP_NOT_FOUND
}

type DescribeErrorParams = {
  error: unknown
}

type DescribeErrorResult = {
  message: string
}

export function describeError({ error }: DescribeErrorParams): DescribeErrorResult {
  if (!(error instanceof ApiError)) return { message: FALLBACK_ERROR_MESSAGE }

  return { message: ERROR_MESSAGES[error.code] ?? FALLBACK_ERROR_MESSAGE }
}
