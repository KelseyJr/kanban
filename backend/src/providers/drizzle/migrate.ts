import { migrate } from 'drizzle-orm/bun-sql/migrator'
import { createDatabase } from './drizzle.client'

const MIGRATIONS_FOLDER = new URL('../../../drizzle', import.meta.url).pathname

type RunMigrationsParams = {
  url: string
}

export async function runMigrations({ url }: RunMigrationsParams): Promise<void> {
  const { database, closeDatabase } = createDatabase({ url })

  try {
    await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER })
  } finally {
    await closeDatabase()
  }
}

if (import.meta.main) {
  const { env } = await import('@/config/env')
  const { logger } = await import('@/main/logger')

  await runMigrations({ url: env.DATABASE_URL })
  logger.info('Migrations applied')
}
