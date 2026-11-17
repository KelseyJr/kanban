import { describe, expect, it } from 'vitest'
import { ApiError, describeError, isNotFoundError } from './api-error'

describe('describeError', () => {
  it('uses the frontend text for the code of an ApiError, ignoring the server message', () => {
    const error = new ApiError({ status: 409, code: 'PROJECT_NAME_ALREADY_EXISTS', message: 'Project x already exists' })

    expect(describeError({ error })).toEqual({ message: 'Já existe um projeto com esse nome.' })
  })

  it('falls back to a generic message for an ApiError with an unknown code', () => {
    const error = new ApiError({ status: 418, code: 'TEAPOT', message: 'x' })

    expect(describeError({ error })).toEqual({ message: 'Algo deu errado. Tente de novo.' })
  })

  it('falls back to a generic message for any other error', () => {
    expect(describeError({ error: new Error('boom') })).toEqual({ message: 'Algo deu errado. Tente de novo.' })
  })
})

describe('isNotFoundError', () => {
  it.each([
    ['a 404 ApiError', new ApiError({ status: 404, code: 'PROJECT_NOT_FOUND', message: 'x' }), true],
    ['a 500 ApiError', new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }), false],
    ['a plain error', new Error('x'), false],
  ])('is %s → %s', (_, error, expected) => {
    expect(isNotFoundError({ error })).toBe(expected)
  })
})
