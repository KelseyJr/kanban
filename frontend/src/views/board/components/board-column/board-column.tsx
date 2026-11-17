import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactElement } from 'react'
import { SlotLabel } from '@/components/slot-label/slot-label'
import { CARD_STAGE_LABELS, type Card, type CardStage } from '@/types/card'
import { SortableCard } from '@/views/board/components/sortable-card/sortable-card'

type MoveCardToStageParams = {
  cardId: string
  stage: CardStage
}

type BoardColumnProps = {
  stage: CardStage
  cards: Card[]
  lastMovedCardId?: string
  onMoveCardToStage: (params: MoveCardToStageParams) => void
}

export function BoardColumn({ stage, cards, lastMovedCardId, onMoveCardToStage }: BoardColumnProps): ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const headingId = `column-${stage}`

  return (
    <section aria-labelledby={headingId} className="flex min-h-[28rem] flex-col rounded-[6px] bg-steel px-2.5 pb-2.5 shadow-slot">
      <SlotLabel id={headingId} name={CARD_STAGE_LABELS[stage]} count={cards.length} headingLevel="h2" />
      <SortableContext id={stage} items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className={`flex flex-1 flex-col gap-2 rounded-[4px] transition-colors ${isOver ? 'bg-steel-deep' : ''}`}>
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              isStamped={card.id === lastMovedCardId}
              onMoveToStage={({ stage: toStage }) => onMoveCardToStage({ cardId: card.id, stage: toStage })}
            />
          ))}
          {cards.length === 0 && <EmptyColumn />}
        </ul>
      </SortableContext>
    </section>
  )
}

function EmptyColumn(): ReactElement {
  return (
    <li className="rounded-[4px] border-2 border-dashed border-steel-line px-2.5 py-7 text-center text-[13px] font-semibold text-steel-text">
      Nenhum card
    </li>
  )
}
