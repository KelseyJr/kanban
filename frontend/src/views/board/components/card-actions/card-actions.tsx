import { type ReactElement, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog/confirm-dialog'
import type { Card, CardStage } from '@/types/card'
import { CardFormDialog } from '@/views/board/components/card-form-dialog/card-form-dialog'
import { MoveCardMenu } from '@/views/board/components/move-card-menu/move-card-menu'
import { useDeleteCard } from '@/hooks/use-delete-card/use-delete-card'
import { useUpdateCard } from '@/hooks/use-update-card/use-update-card'

const CARD_ACTION_MODE = { idle: 'idle', editing: 'editing', deleting: 'deleting' } as const

type CardActionMode = (typeof CARD_ACTION_MODE)[keyof typeof CARD_ACTION_MODE]

type MoveToStageParams = {
  stage: CardStage
}

type CardActionsProps = {
  card: Card
  onMoveToStage: (params: MoveToStageParams) => void
}

const ACTION_CLASSES = 'min-h-8 rounded-[3px] px-1.5 text-xs font-semibold underline decoration-1 underline-offset-2 hover:decoration-2'

export function CardActions({ card, onMoveToStage }: CardActionsProps): ReactElement {
  const [mode, setMode] = useState<CardActionMode>(CARD_ACTION_MODE.idle)
  const close = (): void => setMode(CARD_ACTION_MODE.idle)

  return (
    <div className="flex flex-wrap items-center gap-1">
      <MoveCardMenu card={card} onMoveToStage={onMoveToStage} />
      <span className="flex-1" />
      <button type="button" aria-label={`Editar ${card.title}`} onClick={() => setMode(CARD_ACTION_MODE.editing)} className={ACTION_CLASSES}>
        Editar
      </button>
      <button type="button" aria-label={`Excluir ${card.title}`} onClick={() => setMode(CARD_ACTION_MODE.deleting)} className={ACTION_CLASSES}>
        Excluir
      </button>
      {mode === CARD_ACTION_MODE.editing && <EditCardDialog card={card} onClose={close} />}
      {mode === CARD_ACTION_MODE.deleting && <DeleteCardDialog card={card} onClose={close} />}
    </div>
  )
}

type CardDialogProps = {
  card: Card
  onClose: () => void
}

function EditCardDialog({ card, onClose }: CardDialogProps): ReactElement {
  const { updateCard, isPending } = useUpdateCard({ projectId: card.projectId })

  return (
    <CardFormDialog
      title="Editar card"
      submitLabel="Salvar"
      initialValues={{ title: card.title, description: card.description }}
      isPending={isPending}
      saveCard={(values) => updateCard({ projectId: card.projectId, cardId: card.id, ...values })}
      onClose={onClose}
    />
  )
}

function DeleteCardDialog({ card, onClose }: CardDialogProps): ReactElement {
  const { deleteCard, isPending } = useDeleteCard({ projectId: card.projectId })
  const [errorMessage, setErrorMessage] = useState<string>()

  async function handleConfirm(): Promise<void> {
    const result = await deleteCard({ projectId: card.projectId, cardId: card.id })
    setErrorMessage(result.errorMessage)
    if (!result.errorMessage) onClose()
  }

  return (
    <ConfirmDialog
      title="Excluir card"
      message={`O card “${card.title}” será excluído. Isso não pode ser desfeito.`}
      confirmLabel="Excluir card"
      isPending={isPending}
      errorMessage={errorMessage}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  )
}
