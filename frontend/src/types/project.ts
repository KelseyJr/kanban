import { z } from 'zod'

export const MAX_PROJECT_NAME_LENGTH = 80

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Project = z.infer<typeof projectSchema>

export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o nome do projeto.')
  .max(MAX_PROJECT_NAME_LENGTH, `O nome do projeto deve ter no máximo ${MAX_PROJECT_NAME_LENGTH} caracteres.`)
