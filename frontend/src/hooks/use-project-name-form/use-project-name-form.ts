import { type FormEvent, useState } from 'react'
import { describeError } from '@/services/api-error'
import { validateField } from '@/lib/validate-field'
import { projectNameSchema } from '@/types/project'

type SaveNameParams = {
  name: string
}

type UseProjectNameFormParams = {
  initialName: string
  shouldResetAfterSave: boolean
  saveName: (params: SaveNameParams) => Promise<unknown>
  onSaved?: () => void
}

type UseProjectNameFormResult = {
  name: string
  errorMessage?: string
  setName: (name: string) => void
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

export function useProjectNameForm({
  initialName,
  shouldResetAfterSave,
  saveName,
  onSaved,
}: UseProjectNameFormParams): UseProjectNameFormResult {
  const [name, setName] = useState(initialName)
  const [errorMessage, setErrorMessage] = useState<string>()

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const validation = validateField({ schema: projectNameSchema, value: name })
    setErrorMessage(validation.errorMessage)
    if (validation.value === undefined) return

    try {
      await saveName({ name: validation.value })
      if (shouldResetAfterSave) setName('')
      onSaved?.()
    } catch (error: unknown) {
      setErrorMessage(describeError({ error }).message)
    }
  }

  return { name, errorMessage, setName, handleSubmit }
}
