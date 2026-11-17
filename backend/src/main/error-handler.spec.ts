import { describe, expect, it, spyOn } from 'bun:test'
import pino from 'pino'
import { RequestValidationError } from '@/controllers/request-validation'
import { CardNotFoundError } from '@/domain/card/card.errors'
import { ProjectNameAlreadyExistsError, ProjectNotFoundError } from '@/domain/project/project.errors'
import { toErrorResponse } from './error-handler'

function createSilentLogger(): pino.Logger {
  return pino({ level: 'silent' })
}

describe('toErrorResponse', () => {
  it.each([
    ['ProjectNotFoundError', new ProjectNotFoundError({ projectId: 'p1' }), 404, 'PROJECT_NOT_FOUND'],
    ['CardNotFoundError', new CardNotFoundError({ cardId: 'c1' }), 404, 'CARD_NOT_FOUND'],
    ['ProjectNameAlreadyExistsError', new ProjectNameAlreadyExistsError({ name: 'kanban' }), 409, 'PROJECT_NAME_ALREADY_EXISTS'],
  ])('maps %s to its status and code keeping its message', (_, error, status, code) => {
    const response = toErrorResponse({ code: 'UNKNOWN', error, logger: createSilentLogger() })

    expect(response.status).toBe(status)
    expect(response.body).toMatchObject({ code, message: error.message })
  })

  it('maps a body validation error to 400 VALIDATION_ERROR with its message', () => {
    const error = new RequestValidationError({ target: 'body', message: 'Informe o nome.' })

    const response = toErrorResponse({ code: 'UNKNOWN', error, logger: createSilentLogger() })

    expect(response).toEqual({ status: 400, body: { code: 'VALIDATION_ERROR', message: 'Informe o nome.' } })
  })

  it('maps a malformed path parameter to 404 NOT_FOUND', () => {
    const error = new RequestValidationError({ target: 'params', message: 'Invalid UUID' })

    const response = toErrorResponse({ code: 'UNKNOWN', error, logger: createSilentLogger() })

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('NOT_FOUND')
  })

  it('maps a malformed JSON body to 400 VALIDATION_ERROR', () => {
    const response = toErrorResponse({ code: 'PARSE', error: new Error('Bad Request'), logger: createSilentLogger() })

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('VALIDATION_ERROR')
  })

  it('maps an unknown route to 404 NOT_FOUND', () => {
    const response = toErrorResponse({ code: 'NOT_FOUND', error: new Error('NOT_FOUND'), logger: createSilentLogger() })

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('NOT_FOUND')
  })

  it('maps an unexpected error to 500 with a generic message and logs the detail', () => {
    const logger = createSilentLogger()
    const logError = spyOn(logger, 'error')
    const error = new Error('connection refused at 10.0.0.1')

    const response = toErrorResponse({ code: 'UNKNOWN', error, logger })

    expect(response).toEqual({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } })
    expect(logError).toHaveBeenCalledWith({ err: error, code: 'UNKNOWN' }, 'Unhandled request error')
  })
})
