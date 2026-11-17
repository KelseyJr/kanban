import { describe, expect, it, type Mock, vi } from 'vitest'
import { z } from 'zod'
import { toJsonResponse } from '@/test/fetch-stub'
import { ApiError } from './api-error'
import { requestJson } from './api.client'

const pingSchema = z.object({ status: z.literal('ok') })

type StubFetchParams = {
  respond: () => Promise<Response>
}

type StubFetchResult = {
  fetchMock: Mock<typeof fetch>
}

function stubFetch({ respond }: StubFetchParams): StubFetchResult {
  const fetchMock = vi.fn<typeof fetch>(respond)
  vi.stubGlobal('fetch', fetchMock)

  return { fetchMock }
}

describe('requestJson', () => {
  it('returns the body validated by the schema and calls the API URL', async () => {
    const { fetchMock } = stubFetch({ respond: async () => toJsonResponse({ body: { status: 'ok' } }) })

    const { data } = await requestJson({ path: '/health', schema: pingSchema })

    expect(data).toEqual({ status: 'ok' })
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/health', expect.objectContaining({ method: 'GET' }))
  })

  it('sends the body as JSON with the given method', async () => {
    const { fetchMock } = stubFetch({ respond: async () => toJsonResponse({ body: { status: 'ok' }, status: 201 }) })

    await requestJson({ path: '/projects', method: 'POST', body: { name: 'kanban' }, schema: pingSchema })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'kanban' }),
        headers: { 'content-type': 'application/json' },
      }),
    )
  })

  it('accepts a 204 response with no body', async () => {
    stubFetch({ respond: async () => new Response(null, { status: 204 }) })

    const { data } = await requestJson({ path: '/projects/1', method: 'DELETE', schema: z.undefined() })

    expect(data).toBeUndefined()
  })

  it.each([404, 409, 500])('throws ApiError with the code and message of a %i error body', async (status) => {
    const body = { code: 'SOME_CODE', message: 'Algo deu errado.' }
    stubFetch({ respond: async () => toJsonResponse({ body, status }) })

    const request = requestJson({ path: '/projects', schema: pingSchema })

    await expect(request).rejects.toEqual(expect.objectContaining({ status, code: 'SOME_CODE', message: 'Algo deu errado.' }))
    await expect(request).rejects.toBeInstanceOf(ApiError)
  })

  it('throws UNEXPECTED_RESPONSE when an error body has an unexpected shape', async () => {
    stubFetch({ respond: async () => toJsonResponse({ body: { message: 'nope' }, status: 502 }) })

    const request = requestJson({ path: '/projects', schema: pingSchema })

    await expect(request).rejects.toEqual(expect.objectContaining({ status: 502, code: 'UNEXPECTED_RESPONSE' }))
  })

  it('throws UNEXPECTED_RESPONSE when a success body does not match the schema', async () => {
    stubFetch({ respond: async () => toJsonResponse({ body: { status: 'broken' } }) })

    const request = requestJson({ path: '/health', schema: pingSchema })

    await expect(request).rejects.toEqual(expect.objectContaining({ status: 200, code: 'UNEXPECTED_RESPONSE' }))
  })

  it('throws UNEXPECTED_RESPONSE when the body is not JSON', async () => {
    stubFetch({ respond: async () => new Response('<html>', { status: 200 }) })

    const request = requestJson({ path: '/health', schema: pingSchema })

    await expect(request).rejects.toEqual(expect.objectContaining({ code: 'UNEXPECTED_RESPONSE' }))
  })

  it('throws NETWORK_ERROR when the server cannot be reached', async () => {
    stubFetch({
      respond: async () => {
        throw new TypeError('Failed to fetch')
      },
    })

    const request = requestJson({ path: '/health', schema: pingSchema })

    await expect(request).rejects.toEqual(expect.objectContaining({ status: 0, code: 'NETWORK_ERROR' }))
  })

  it('gives each request a 10 second timeout and throws TIMEOUT when it expires', async () => {
    stubFetch({
      respond: async () => {
        throw new DOMException('The operation timed out.', 'TimeoutError')
      },
    })
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')

    const request = requestJson({ path: '/health', schema: pingSchema })

    await expect(request).rejects.toEqual(expect.objectContaining({ status: 0, code: 'TIMEOUT' }))
    expect(timeoutSpy).toHaveBeenCalledWith(10_000)
  })
})
