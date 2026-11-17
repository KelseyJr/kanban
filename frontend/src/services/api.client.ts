import { z } from 'zod'
import { env } from '@/config/env'
import { ApiError, CLIENT_ERROR_CODE } from './api-error'

const REQUEST_TIMEOUT_IN_MS = 10_000
const HTTP_NO_CONTENT = 204
const NO_STATUS = 0

const errorBodySchema = z.object({ code: z.string(), message: z.string() })

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type SendRequestParams = {
  path: string
  method: HttpMethod
  body?: unknown
}

type RequestJsonParams<T> = {
  path: string
  method?: HttpMethod
  body?: unknown
  schema: z.ZodType<T>
}

type RequestJsonResult<T> = {
  data: T
}

type ErrorFactoryParams = {
  status: number
  cause: unknown
}

function createUnexpectedResponseError({ status, cause }: ErrorFactoryParams): ApiError {
  const message = 'O servidor respondeu de um jeito inesperado.'
  return new ApiError({ status, code: CLIENT_ERROR_CODE.unexpectedResponse, message, cause })
}

type CreateConnectionErrorParams = {
  error: unknown
}

function createConnectionError({ error }: CreateConnectionErrorParams): ApiError {
  const isTimeout = error instanceof DOMException && error.name === 'TimeoutError'
  if (isTimeout) {
    const message = 'O servidor demorou demais para responder.'
    return new ApiError({ status: NO_STATUS, code: CLIENT_ERROR_CODE.timeout, message, cause: error })
  }

  const message = 'Não foi possível falar com o servidor.'
  return new ApiError({ status: NO_STATUS, code: CLIENT_ERROR_CODE.network, message, cause: error })
}

async function sendRequest({ path, method, body }: SendRequestParams): Promise<Response> {
  const hasBody = body !== undefined

  try {
    return await fetch(`${env.VITE_API_URL}${path}`, {
      method,
      headers: hasBody ? { 'content-type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_IN_MS),
    })
  } catch (error: unknown) {
    throw createConnectionError({ error })
  }
}

type ReadBodyParams = {
  response: Response
}

async function readBody({ response }: ReadBodyParams): Promise<unknown> {
  if (response.status === HTTP_NO_CONTENT) return undefined

  try {
    return await response.json()
  } catch (error: unknown) {
    throw createUnexpectedResponseError({ status: response.status, cause: error })
  }
}

type CreateResponseErrorParams = {
  status: number
  body: unknown
}

function createResponseError({ status, body }: CreateResponseErrorParams): ApiError {
  const errorBody = errorBodySchema.safeParse(body)
  if (!errorBody.success) return createUnexpectedResponseError({ status, cause: errorBody.error })

  return new ApiError({ status, ...errorBody.data })
}

export async function requestJson<T>({
  path,
  method = 'GET',
  body,
  schema,
}: RequestJsonParams<T>): Promise<RequestJsonResult<T>> {
  const response = await sendRequest({ path, method, body })
  const responseBody = await readBody({ response })
  if (!response.ok) throw createResponseError({ status: response.status, body: responseBody })

  const parsed = schema.safeParse(responseBody)
  if (!parsed.success) throw createUnexpectedResponseError({ status: response.status, cause: parsed.error })

  return { data: parsed.data }
}
