import { type Mock, vi } from 'vitest'

export type StubbedResponse = {
  status?: number
  body?: unknown
}

type RespondParams = {
  body: unknown
}

export type FetchRoute = {
  method: string
  path: string
  respond: (params: RespondParams) => StubbedResponse | Promise<StubbedResponse>
}

const API_URL = 'http://api.test'

export function toJsonResponse({ status = 200, body }: StubbedResponse): Response {
  if (body === undefined) return new Response(null, { status })

  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

type StubApiParams = {
  routes: FetchRoute[]
}

type StubApiResult = {
  fetchMock: Mock<typeof fetch>
}

export function stubApi({ routes }: StubApiParams): StubApiResult {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const method = init?.method ?? 'GET'
    const path = String(input).replace(API_URL, '')
    const route = routes.find((candidate) => candidate.method === method && candidate.path === path)
    if (!route) throw new Error(`Unexpected request ${method} ${path}`)

    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    return toJsonResponse(await route.respond({ body }))
  })
  vi.stubGlobal('fetch', fetchMock)

  return { fetchMock }
}
