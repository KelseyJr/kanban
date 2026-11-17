import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'
import * as schema from './schema'

const CONNECTION_TIMEOUT_IN_SECONDS = 10

type CreateDatabaseParams = {
  url: string
}

export type Database = ReturnType<typeof drizzle<typeof schema>>

type CreateDatabaseResult = {
  database: Database
  closeDatabase: () => Promise<void>
}

export function createDatabase({ url }: CreateDatabaseParams): CreateDatabaseResult {
  const client = new SQL({ url, connectionTimeout: CONNECTION_TIMEOUT_IN_SECONDS })
  const database = drizzle({ client, schema })

  async function closeDatabase(): Promise<void> {
    await client.close()
  }

  return { database, closeDatabase }
}
