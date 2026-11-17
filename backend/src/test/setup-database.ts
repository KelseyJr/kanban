import { sql } from 'drizzle-orm'
import { env } from '@/config/env'
import { createDatabase } from '@/providers/drizzle/drizzle.client'
import { runMigrations } from '@/providers/drizzle/migrate'

async function prepareTestDatabase(): Promise<void> {
  try {
    await runMigrations({ url: env.DATABASE_URL })
  } catch (error: unknown) {
    throw new Error(
      `Could not migrate the test database at ${new URL(env.DATABASE_URL).host}. ` +
        'Is Postgres running? Start it with `docker compose up -d` in backend/.',
      { cause: error },
    )
  }
}

await prepareTestDatabase()

export const { database: testDatabase } = createDatabase({ url: env.DATABASE_URL })

export async function resetDatabase(): Promise<void> {
  await testDatabase.execute(sql`truncate table cards, projects restart identity cascade`)
}
