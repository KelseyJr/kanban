import type { ReactElement, ReactNode } from 'react'
import type { Card } from '@/types/card'
import { CardPostmark } from '@/views/board/components/card-postmark/card-postmark'

type CardItemProps = {
  card: Card
  isStamped?: boolean
  isLifted?: boolean
  dragHandle?: ReactNode
  actions?: ReactNode
}

const LIFTED_CLASSES = 'border-postal bg-ink text-paper shadow-lifted [&_p]:text-steel-text'
const RESTING_CLASSES = 'border-ink bg-paper text-[#121c36] shadow-envelope'

export function CardItem({ card, isStamped = false, isLifted = false, dragHandle, actions }: CardItemProps): ReactElement {
  return (
    <article
      aria-label={card.title}
      className={`relative border-t-4 px-3 pt-3 pb-2.5 ${isLifted ? LIFTED_CLASSES : RESTING_CLASSES}`}
    >
      {isStamped && <CardPostmark stage={card.stage} movedAt={card.updatedAt} />}
      <div className="flex items-start gap-1.5">
        {dragHandle}
        <h3 className={`min-w-0 flex-1 text-[15px] leading-snug font-semibold break-words ${isStamped ? 'pr-14' : ''}`}>{card.title}</h3>
      </div>
      {card.description && (
        <p className={`mt-1.5 line-clamp-4 text-[13px] leading-snug wrap-anywhere text-ink-soft ${isStamped ? 'pr-12' : ''}`}>{card.description}</p>
      )}
      {actions && <div className="mt-2.5">{actions}</div>}
    </article>
  )
}
