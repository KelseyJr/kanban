import type { Logger } from 'pino'
import { CardNotFoundError } from '@/domain/card/card.errors'
import { ProjectNameAlreadyExistsError, ProjectNotFoundError } from '@/domain/project/project.errors'
import { HTTP_STATUS } from '@/controllers/http-response'
import { RequestValidationError } from '@/controllers/request-validation'

export const API_ERROR_CODE = {
  validation: 'VALIDATION_ERROR',
  notFound: 'NOT_FOUND',
  projectNotFound: 'PROJECT_NOT_FOUND',
  cardNotFound: 'CARD_NOT_FOUND',
  projectNameAlreadyExists: 'PROJECT_NAME_ALREADY_EXISTS',
  internal: 'INTERNAL_ERROR',
} as const

type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE]

export type ErrorResponse = {
  status: number
  body: { code: ApiErrorCode; message: string }
}

type ErrorClass = new (...args: never[]) => Error

type DomainErrorMapping = {
  errorClass: ErrorClass
  status: number
  code: ApiErrorCode
}

const DOMAIN_ERROR_MAPPINGS: DomainErrorMapping[] = [
  { errorClass: ProjectNotFoundError, status: HTTP_STATUS.notFound, code: API_ERROR_CODE.projectNotFound },
  { errorClass: CardNotFoundError, status: HTTP_STATUS.notFound, code: API_ERROR_CODE.cardNotFound },
  { errorClass: ProjectNameAlreadyExistsError, status: HTTP_STATUS.conflict, code: API_ERROR_CODE.projectNameAlreadyExists },
]

const FRAMEWORK_VALIDATION_CODES = new Set<string | number>(['VALIDATION', 'PARSE'])
const MALFORMED_BODY_MESSAGE = 'Corpo da requisição inválido.'
const RESOURCE_NOT_FOUND_MESSAGE = 'Recurso não encontrado.'
const INTERNAL_ERROR_MESSAGE = 'Erro interno do servidor.'

type BuildResponseParams = {
  status: number
  code: ApiErrorCode
  message: string
}

function buildResponse({ status, code, message }: BuildResponseParams): ErrorResponse {
  return { status, body: { code, message } }
}

type ToErrorResponseParams = {
  code: string | number
  error: unknown
  logger: Logger
}

function toRequestValidationResponse({ error }: { error: RequestValidationError }): ErrorResponse {
  if (error.target === 'params') {
    return buildResponse({ status: HTTP_STATUS.notFound, code: API_ERROR_CODE.notFound, message: RESOURCE_NOT_FOUND_MESSAGE })
  }

  return buildResponse({ status: HTTP_STATUS.badRequest, code: API_ERROR_CODE.validation, message: error.message })
}

export function toErrorResponse({ code, error, logger }: ToErrorResponseParams): ErrorResponse {
  const mapping = DOMAIN_ERROR_MAPPINGS.find(({ errorClass }) => error instanceof errorClass)
  if (mapping && error instanceof Error) {
    return buildResponse({ status: mapping.status, code: mapping.code, message: error.message })
  }
  if (error instanceof RequestValidationError) return toRequestValidationResponse({ error })
  if (code === 'NOT_FOUND') {
    return buildResponse({ status: HTTP_STATUS.notFound, code: API_ERROR_CODE.notFound, message: RESOURCE_NOT_FOUND_MESSAGE })
  }
  if (FRAMEWORK_VALIDATION_CODES.has(code)) {
    return buildResponse({ status: HTTP_STATUS.badRequest, code: API_ERROR_CODE.validation, message: MALFORMED_BODY_MESSAGE })
  }

  logger.error({ err: error, code }, 'Unhandled request error')
  return buildResponse({ status: HTTP_STATUS.internalServerError, code: API_ERROR_CODE.internal, message: INTERNAL_ERROR_MESSAGE })
}
