import { describe, expect, it } from 'bun:test'
import type { AnyElysia } from 'elysia'
import pino from 'pino'
import { testDatabase } from '@/test/setup-database'
import { createApp } from './app'

const ALLOWED_ORIGIN = 'http://localhost:3000'

function createTestApp(): AnyElysia {
  return createApp({ database: testDatabase, corsOrigin: ALLOWED_ORIGIN, logger: pino({ level: 'silent' }) })
}

describe('createApp', () => {
  it('answers GET /health with 200 and status ok', async () => {
    const response = await createTestApp().handle(new Request('http://localhost/health'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it('allows the configured origin through CORS', async () => {
    const request = new Request('http://localhost/health', { headers: { origin: ALLOWED_ORIGIN } })

    const response = await createTestApp().handle(request)

    expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN)
  })

  it('does not allow other origins through CORS', async () => {
    const request = new Request('http://localhost/health', { headers: { origin: 'http://evil.example' } })

    const response = await createTestApp().handle(request)

    expect(response.headers.get('access-control-allow-origin')).not.toBe('http://evil.example')
  })

  it('answers an unknown route with 404 in the standard error format', async () => {
    const response = await createTestApp().handle(new Request('http://localhost/unknown'))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ code: 'NOT_FOUND', message: 'Recurso não encontrado.' })
  })

  it('answers a malformed JSON body with 400 VALIDATION_ERROR', async () => {
    const request = new Request('http://localhost/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    })

    const response = await createTestApp().handle(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('answers a request through the real routes, use cases and database', async () => {
    const response = await createTestApp().handle(new Request('http://localhost/projects'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ projects: expect.any(Array) })
  })
})
