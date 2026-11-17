import type { ReactElement } from 'react'
import { getButtonClasses } from '@/components/button-styles/button-styles'
import { ModalDialog } from '@/components/modal-dialog/modal-dialog'
import { TextField } from '@/components/text-field/text-field'
import { type CardFormValues, useCardForm } from '@/hooks/use-card-form/use-card-form'

type CardFormDialogProps = {
  title: string
  submitLabel: string
  initialValues: CardFormValues
  isPending: boolean
  saveCard: (values: CardFormValues) => Promise<unknown>
  onClose: () => void
}

export function CardFormDialog({ title, submitLabel, initialValues, isPending, saveCard, onClose }: CardFormDialogProps): ReactElement {
  const { values, errors, setTitle, setDescription, handleSubmit } = useCardForm({ initialValues, saveCard, onSaved: onClose })

  return (
    <ModalDialog title={title} onClose={onClose}>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField label="Título" value={values.title} errorMessage={errors.title} onChange={setTitle} />
        <TextField label="Descrição (opcional)" value={values.description} errorMessage={errors.description} isMultiline onChange={setDescription} />
        {errors.submit && <p role="alert" className="text-sm font-semibold text-stamp">{errors.submit}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={getButtonClasses({ variant: 'secondary' })}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={getButtonClasses({ variant: 'primary' })}>
            {submitLabel}
          </button>
        </div>
      </form>
    </ModalDialog>
  )
}
