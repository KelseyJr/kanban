import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/providers/drizzle/schema.ts',
  out: './drizzle',
})
