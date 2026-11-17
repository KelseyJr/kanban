import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactElement } from 'react'
import { GripIcon } from '@/components/icons/icons'
import type { Card, CardStage } from '@/types/card'
import { CardActions } from '@/views/board/components/card-actions/card-actions'
import { CardItem } from '@/views/board/components/card-item/card-item'

type MoveToStageParams = {
  stage: CardStage
}

type SortableCardProps = {
  card: Card
  isStamped: boolean
  onMoveToStage: (params: MoveToStageParams) => void
}

export function SortableCard({ card, isStamped, onMoveToStage }: SortableCardProps): ReactElement {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      aria-label={`Arrastar ${card.title}`}
      className="-ml-1 flex min-h-7 min-w-6 cursor-grab touch-none items-center justify-center rounded-[2px] text-ink-faint hover:text-ink active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripIcon />
    </button>
  )

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={isDragging ? 'opacity-35' : undefined}>
      <CardItem card={card} isStamped={isStamped} dragHandle={dragHandle} actions={<CardActions card={card} onMoveToStage={onMoveToStage} />} />
    </li>
  )
}
