import { closestCorners, DndContext, DragOverlay } from '@dnd-kit/core'
import { type ReactElement, useId } from 'react'
import { type Card, ORDERED_CARD_STAGES } from '@/types/card'
import { BoardColumn } from '@/views/board/components/board-column/board-column'
import { CardItem } from '@/views/board/components/card-item/card-item'
import { SCREEN_READER_INSTRUCTIONS } from '@/hooks/use-board-dnd/dnd-announcements'
import { type CardsByStage, groupCardsByStage } from '@/hooks/use-board-dnd/group-cards-by-stage'
import { MoveErrorAlert } from '@/views/board/components/move-error-alert/move-error-alert'
import { useBoardDnd } from '@/hooks/use-board-dnd/use-board-dnd'
import { type MoveCardParams, useMoveCard } from '@/hooks/use-move-card/use-move-card'

type BoardProps = {
  projectId: string
  cards: Card[]
}

export function Board({ projectId, cards }: BoardProps): ReactElement {
  const dndContextId = useId()
  const { cardsByStage } = groupCardsByStage({ cards })
  const { moveCard, errorMessage, lastMovedCardId } = useMoveCard({ projectId })
  const dnd = useBoardDnd({ cards, cardsByStage, moveCard })

  return (
    <DndContext
      id={dndContextId}
      sensors={dnd.sensors}
      collisionDetection={closestCorners}
      accessibility={{ announcements: dnd.announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
      onDragStart={dnd.handleDragStart}
      onDragEnd={dnd.handleDragEnd}
      onDragCancel={dnd.handleDragCancel}
    >
      <MoveErrorAlert message={errorMessage} />
      <BoardColumns cardsByStage={cardsByStage} lastMovedCardId={lastMovedCardId} moveCard={moveCard} />
      <DragOverlay>{dnd.activeCard && <CardItem card={dnd.activeCard} isLifted />}</DragOverlay>
    </DndContext>
  )
}

type BoardColumnsProps = {
  cardsByStage: CardsByStage
  lastMovedCardId?: string
  moveCard: (params: MoveCardParams) => void
}

function BoardColumns({ cardsByStage, lastMovedCardId, moveCard }: BoardColumnsProps): ReactElement {
  return (
    <div className="grid auto-cols-[minmax(16rem,1fr)] grid-flow-col gap-3.5 overflow-x-auto pb-2 lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible">
      {ORDERED_CARD_STAGES.map((stage) => (
        <BoardColumn
          key={stage}
          stage={stage}
          cards={cardsByStage[stage]}
          lastMovedCardId={lastMovedCardId}
          onMoveCardToStage={({ cardId, stage: toStage }) => moveCard({ cardId, stage: toStage, position: cardsByStage[toStage].length })}
        />
      ))}
    </div>
  )
}
