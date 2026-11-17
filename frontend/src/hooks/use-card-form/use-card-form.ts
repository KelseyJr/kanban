import { type FormEvent, useState } from 'react'
import { describeError } from '@/services/api-error'
import { validateField } from '@/lib/validate-field'
import { cardDescriptionSchema, cardTitleSchema } from '@/types/card'

export type CardFormValues = {
  title: string
  description: string
}

type UseCardFormParams = {
  initialValues: CardFormValues
  saveCard: (values: CardFormValues) => Promise<unknown>
  onSaved: () => void
}

type CardFormErrors = {
  title?: string
  description?: string
  submit?: string
}

type UseCardFormResult = {
  values: CardFormValues
  errors: CardFormErrors
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

export function useCardForm({ initialValues, saveCard, onSaved }: UseCardFormParams): UseCardFormResult {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<CardFormErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const title = validateField({ schema: cardTitleSchema, value: values.title })
    const description = validateField({ schema: cardDescriptionSchema, value: values.description })
    setErrors({ title: title.errorMessage, description: description.errorMessage })
    if (title.value === undefined || description.value === undefined) return

    try {
      await saveCard({ title: title.value, description: description.value })
      onSaved()
    } catch (error: unknown) {
      setErrors({ submit: describeError({ error }).message })
    }
  }

  return {
    values,
    errors,
    setTitle: (title) => setValues((current) => ({ ...current, title })),
    setDescription: (description) => setValues((current) => ({ ...current, description })),
    handleSubmit,
  }
}
