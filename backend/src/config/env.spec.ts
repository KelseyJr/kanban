import { describe, expect, it } from 'bun:test'
import { parseEnv } from './env'

const VALID_SOURCE = {
  DATABASE_URL: 'postgres://kanban:kanban@localhost:5432/kanban',
  CORS_ORIGIN: 'http://localhost:3000',
}

describe('parseEnv', () => {
  it('throws naming DATABASE_URL when it is missing', () => {
    const source = { CORS_ORIGIN: VALID_SOURCE.CORS_ORIGIN }

    expect(() => parseEnv({ source })).toThrow(/DATABASE_URL/)
  })

  it('throws naming CORS_ORIGIN when it is missing', () => {
    const source = { DATABASE_URL: VALID_SOURCE.DATABASE_URL }

    expect(() => parseEnv({ source })).toThrow(/CORS_ORIGIN/)
  })

  it('throws when DATABASE_URL is not a URL', () => {
    const source = { ...VALID_SOURCE, DATABASE_URL: 'not a url' }

    expect(() => parseEnv({ source })).toThrow(/DATABASE_URL/)
  })

  it('throws when DATABASE_URL is not a Postgres URL', () => {
    const source = { ...VALID_SOURCE, DATABASE_URL: 'http://localhost:5432/kanban' }

    expect(() => parseEnv({ source })).toThrow(/DATABASE_URL/)
  })

  it('defaults PORT to 3333 and LOG_LEVEL to info', () => {
    const { env } = parseEnv({ source: VALID_SOURCE })

    expect(env.PORT).toBe(3333)
    expect(env.LOG_LEVEL).toBe('info')
  })

  it('converts PORT to a number', () => {
    const { env } = parseEnv({ source: { ...VALID_SOURCE, PORT: '4000' } })

    expect(env.PORT).toBe(4000)
  })
})
