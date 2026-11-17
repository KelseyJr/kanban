import type { ReactElement } from 'react'
import { getButtonClasses } from '@/components/button-styles/button-styles'
import { ModalDialog } from '@/components/modal-dialog/modal-dialog'

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  isPending: boolean
  errorMessage?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  return (
    <ModalDialog title={title} onClose={onCancel}>
      <p className="text-sm text-slate-700">{message}</p>
      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={getButtonClasses({ variant: 'secondary' })} onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className={getButtonClasses({ variant: 'danger' })} disabled={isPending} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </ModalDialog>
  )
}
