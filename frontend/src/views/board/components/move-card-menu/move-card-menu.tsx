import { type KeyboardEvent, type ReactElement, useId, useState } from 'react'
import { ChevronDownIcon } from '@/components/icons/icons'
import { CARD_STAGE_LABELS, type Card, type CardStage, ORDERED_CARD_STAGES } from '@/types/card'

type MoveToStageParams = {
  stage: CardStage
}

type MoveCardMenuProps = {
  card: Card
  onMoveToStage: (params: MoveToStageParams) => void
}

export function MoveCardMenu({ card, onMoveToStage }: MoveCardMenuProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const destinations = ORDERED_CARD_STAGES.filter((stage) => stage !== card.stage)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') setIsOpen(false)
  }

  function handleChoose({ stage }: MoveToStageParams): void {
    setIsOpen(false)
    onMoveToStage({ stage })
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <MenuTrigger cardTitle={card.title} menuId={menuId} isOpen={isOpen} onToggle={() => setIsOpen((wasOpen) => !wasOpen)} />
      {isOpen && <DestinationList id={menuId} destinations={destinations} onChoose={handleChoose} />}
    </div>
  )
}

type MenuTriggerProps = {
  cardTitle: string
  menuId: string
  isOpen: boolean
  onToggle: () => void
}

function MenuTrigger({ cardTitle, menuId, isOpen, onToggle }: MenuTriggerProps): ReactElement {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={menuId}
      aria-label={`Mover para: ${cardTitle}`}
      onClick={onToggle}
      className="inline-flex min-h-8 items-center gap-1 rounded-[3px] border-[1.5px] border-current px-2 text-xs font-semibold"
    >
      Mover para
      <ChevronDownIcon />
    </button>
  )
}

type DestinationListProps = {
  id: string
  destinations: CardStage[]
  onChoose: (params: MoveToStageParams) => void
}

function DestinationList({ id, destinations, onChoose }: DestinationListProps): ReactElement {
  return (
    <ul id={id} aria-label="Colunas de destino" className="absolute left-0 z-20 mt-1 min-w-40 rounded-[3px] border-2 border-ink bg-paper p-1 text-ink shadow-lifted">
      {destinations.map((stage) => (
        <li key={stage}>
          <button
            type="button"
            onClick={() => onChoose({ stage })}
            className="w-full rounded-[2px] px-2.5 py-1.5 text-left text-sm font-semibold hover:bg-postal focus-visible:bg-postal"
          >
            {CARD_STAGE_LABELS[stage]}
          </button>
        </li>
      ))}
    </ul>
  )
}
