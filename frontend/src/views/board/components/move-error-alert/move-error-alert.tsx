import type { ReactElement } from 'react'

type MoveErrorAlertProps = {
  message?: string
}

export function MoveErrorAlert({ message }: MoveErrorAlertProps): ReactElement {
  return (
    <div role="alert" className="min-h-0">
      {message && (
        <p className="mb-4 inline-block rounded-[3px] border-2 border-stamp bg-paper px-3 py-2 text-sm font-bold text-stamp">
          {message}
        </p>
      )}
    </div>
  )
}
