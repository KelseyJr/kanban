import { describe, expect, it, vi } from 'vitest'
import { getApiBaseUrl, parseServerEnv } from './env'

describe('parseServerEnv', () => {
  it('throws naming API_URL when it is missing', () => {
    expect(() => parseServerEnv({ source: {} })).toThrow(/API_URL/)
  })

  it('throws naming API_URL when it is not a URL', () => {
    expect(() => parseServerEnv({ source: { API_URL: 'localhost' } })).toThrow(/API_URL/)
  })

  it('returns the API URL when it is valid', () => {
    const { env } = parseServerEnv({ source: { API_URL: 'http://localhost:3333' } })

    expect(env.API_URL).toBe('http://localhost:3333')
  })
})

describe('getApiBaseUrl', () => {
  it('returns API_URL read from the process environment on the server', () => {
    vi.stubEnv('API_URL', 'http://backend:3333')

    const apiBaseUrl = getApiBaseUrl()

    expect(apiBaseUrl).toBe('http://backend:3333')
  })
})
