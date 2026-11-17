import { z } from 'zod'
import { ORDERED_CARD_STAGES } from '@/domain/card/card.entity'

const MAX_PROJECT_NAME_LENGTH = 80
const MAX_CARD_TITLE_LENGTH = 120
const MAX_CARD_DESCRIPTION_LENGTH = 5000

export const projectParamsSchema = z.object({ projectId: z.uuid() })

export const cardParamsSchema = z.object({ projectId: z.uuid(), cardId: z.uuid() })

export const projectNameSchema = z
  .string({ error: 'Informe o nome do projeto.' })
  .trim()
  .min(1, 'Informe o nome do projeto.')
  .max(MAX_PROJECT_NAME_LENGTH, `O nome do projeto deve ter no máximo ${MAX_PROJECT_NAME_LENGTH} caracteres.`)

export const cardTitleSchema = z
  .string({ error: 'Informe o título do card.' })
  .trim()
  .min(1, 'Informe o título do card.')
  .max(MAX_CARD_TITLE_LENGTH, `O título deve ter no máximo ${MAX_CARD_TITLE_LENGTH} caracteres.`)

export const cardDescriptionSchema = z
  .string({ error: 'A descrição deve ser um texto.' })
  .max(MAX_CARD_DESCRIPTION_LENGTH, `A descrição deve ter no máximo ${MAX_CARD_DESCRIPTION_LENGTH} caracteres.`)

export const cardStageSchema = z.enum(ORDERED_CARD_STAGES, {
  error: `A coluna deve ser uma de: ${ORDERED_CARD_STAGES.join(', ')}.`,
})

export const cardPositionSchema = z
  .int({ error: 'A posição deve ser um número inteiro.' })
  .min(0, 'A posição deve ser maior ou igual a zero.')
