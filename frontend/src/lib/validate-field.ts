import type { z } from 'zod'

type ValidateFieldParams = {
  schema: z.ZodType<string>
  value: string
}

type ValidateFieldResult = {
  value?: string
  errorMessage?: string
}

export function validateField({ schema, value }: ValidateFieldParams): ValidateFieldResult {
  const result = schema.safeParse(value)
  if (result.success) return { value: result.data }

  return { errorMessage: result.error.issues[0]?.message ?? 'Valor inválido.' }
}
