import { type ReactElement, useState } from 'react'
import { getButtonClasses } from '@/components/button-styles/button-styles'
import { PlusIcon } from '@/components/icons/icons'
import { CardFormDialog } from '@/views/board/components/card-form-dialog/card-form-dialog'
import type { CardFormValues } from '@/hooks/use-card-form/use-card-form'
import { useCreateCard } from '@/hooks/use-create-card/use-create-card'

const EMPTY_CARD: CardFormValues = { title: '', description: '' }

type CreateCardButtonProps = {
  projectId: string
}

export function CreateCardButton({ projectId }: CreateCardButtonProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const { createCard, isPending } = useCreateCard({ projectId })

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={getButtonClasses({ variant: 'primary' })}>
        <PlusIcon />
        Novo card
      </button>
      {isOpen && (
        <CardFormDialog
          title="Novo card no Backlog"
          submitLabel="Criar card"
          initialValues={EMPTY_CARD}
          isPending={isPending}
          saveCard={(values) => createCard({ projectId, ...values })}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
