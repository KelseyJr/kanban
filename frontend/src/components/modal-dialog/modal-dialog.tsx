import { type ReactElement, type ReactNode, type SyntheticEvent, useEffect, useId, useRef } from 'react'

type ModalDialogProps = {
  title: string
  children: ReactNode
  onClose: () => void
}

export function ModalDialog({ title, children, onClose }: ModalDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()

    return () => dialog?.close()
  }, [])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>): void {
    event.preventDefault()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-b-[6px] border-t-[6px] border-ink bg-paper p-6 text-ink shadow-lifted backdrop:bg-steel-deep/70"
    >
      <h2 id={titleId} className="mb-5 text-lg font-extrabold">
        {title}
      </h2>
      {children}
    </dialog>
  )
}
