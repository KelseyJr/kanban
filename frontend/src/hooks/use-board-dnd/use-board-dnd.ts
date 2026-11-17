import {
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  type SensorDescriptor,
  type SensorOptions,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { Card } from '@/types/card'
import { createAnnouncements } from './dnd-announcements'
import type { CardsByStage } from './group-cards-by-stage'
import { resolveDropTarget } from './resolve-drop-target'
import type { MoveCardParams } from '@/hooks/use-move-card/use-move-card'

const POINTER_ACTIVATION_DISTANCE_IN_PX = 6
const TOUCH_ACTIVATION_DELAY_IN_MS = 200
const TOUCH_TOLERANCE_IN_PX = 6

type UseBoardDndParams = {
  cards: readonly Card[]
  cardsByStage: CardsByStage
  moveCard: (params: MoveCardParams) => void
}

type UseBoardDndResult = {
  sensors: SensorDescriptor<SensorOptions>[]
  announcements: Announcements
  activeCard?: Card
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

function isDroppedBelow({ active, over }: Pick<DragEndEvent, 'active' | 'over'>): boolean {
  const translated = active.rect.current.translated
  if (!translated || !over) return false

  return translated.top > over.rect.top + over.rect.height / 2
}

export function useBoardDnd({ cards, cardsByStage, moveCard }: UseBoardDndParams): UseBoardDndResult {
  const [activeCardId, setActiveCardId] = useState<string>()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE_IN_PX } }),
    useSensor(TouchSensor, { activationConstraint: { delay: TOUCH_ACTIVATION_DELAY_IN_MS, tolerance: TOUCH_TOLERANCE_IN_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent): void {
    setActiveCardId(undefined)
    if (!over) return

    const cardId = String(active.id)
    const isBelowOverCard = isDroppedBelow({ active, over })
    const target = resolveDropTarget({ activeId: cardId, overId: String(over.id), isBelowOverCard, cardsByStage })
    const card = cards.find((candidate) => candidate.id === cardId)
    const isSamePlace = card?.stage === target?.stage && card?.position === target?.position
    if (target && !isSamePlace) moveCard({ cardId, ...target })
  }

  return {
    sensors,
    announcements: createAnnouncements({ cards }),
    activeCard: cards.find((card) => card.id === activeCardId),
    handleDragStart: ({ active }): void => setActiveCardId(String(active.id)),
    handleDragEnd,
    handleDragCancel: (): void => setActiveCardId(undefined),
  }
}
