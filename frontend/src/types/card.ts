import { z } from 'zod'

export const CARD_STAGE = {
  backlog: 'backlog',
  explore: 'explore',
  propose: 'propose',
  apply: 'apply',
  archive: 'archive',
} as const

export type CardStage = (typeof CARD_STAGE)[keyof typeof CARD_STAGE]

export const ORDERED_CARD_STAGES = [
  CARD_STAGE.backlog,
  CARD_STAGE.explore,
  CARD_STAGE.propose,
  CARD_STAGE.apply,
  CARD_STAGE.archive,
] as const satisfies readonly CardStage[]

export const CARD_STAGE_LABELS: Record<CardStage, string> = {
  backlog: 'Backlog',
  explore: 'Explore',
  propose: 'Propose',
  apply: 'Apply',
  archive: 'Archive',
}

export const MAX_CARD_TITLE_LENGTH = 120
export const MAX_CARD_DESCRIPTION_LENGTH = 5000

export const cardSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  stage: z.enum(ORDERED_CARD_STAGES),
  position: z.number().int(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Card = z.infer<typeof cardSchema>

export const cardTitleSchema = z
  .string()
  .trim()
  .min(1, 'Informe o título do card.')
  .max(MAX_CARD_TITLE_LENGTH, `O título deve ter no máximo ${MAX_CARD_TITLE_LENGTH} caracteres.`)

export const cardDescriptionSchema = z
  .string()
  .max(MAX_CARD_DESCRIPTION_LENGTH, `A descrição deve ter no máximo ${MAX_CARD_DESCRIPTION_LENGTH} caracteres.`)
