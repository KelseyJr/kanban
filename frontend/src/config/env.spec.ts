import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

describe('parseEnv', () => {
  it('throws naming VITE_API_URL when it is missing', () => {
    expect(() => parseEnv({ source: {} })).toThrow(/VITE_API_URL/)
  })

  it('throws naming VITE_API_URL when it is not a URL', () => {
    expect(() => parseEnv({ source: { VITE_API_URL: 'localhost' } })).toThrow(/VITE_API_URL/)
  })

  it('returns the API URL when it is valid', () => {
    const { env } = parseEnv({ source: { VITE_API_URL: 'http://localhost:3333' } })

    expect(env.VITE_API_URL).toBe('http://localhost:3333')
  })
})
