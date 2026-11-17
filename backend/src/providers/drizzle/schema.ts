import { sql } from 'drizzle-orm'
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { ORDERED_CARD_STAGES } from '../../domain/card/card.entity'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const cardStageEnum = pgEnum('card_stage', ORDERED_CARD_STAGES)

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('projects_name_lower_unique').on(sql`lower(${table.name})`)],
)

export const cards = pgTable(
  'cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    stage: cardStageEnum('stage').notNull(),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    ...timestamps,
  },
  (table) => [index('cards_project_stage_position_index').on(table.projectId, table.stage, table.position)],
)
