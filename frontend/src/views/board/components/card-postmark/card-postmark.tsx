import type { ReactElement } from 'react'
import { CARD_STAGE_LABELS, type CardStage } from '@/types/card'

const POSTMARK_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

type FormatPostmarkDateParams = {
  isoDate: string
}

function formatPostmarkDate({ isoDate }: FormatPostmarkDateParams): string {
  return POSTMARK_DATE_FORMAT.format(new Date(isoDate)).replace(' de ', ' ').replace('.', '').toUpperCase()
}

type CardPostmarkProps = {
  stage: CardStage
  movedAt: string
}

export function CardPostmark({ stage, movedAt }: CardPostmarkProps): ReactElement {
  return (
    <span className="pointer-events-none absolute -top-3 right-2.5 flex size-16 rotate-[-12deg] animate-[postmark-in_420ms_var(--ease-out-expo)] flex-col items-center justify-center rounded-full border-[2.5px] border-stamp bg-paper/70 text-center text-[10px] leading-tight font-extrabold tracking-[0.06em] text-stamp uppercase [font-stretch:80%]">
      <span className="sr-only">Movido agora para </span>
      {CARD_STAGE_LABELS[stage]}
      <span>{formatPostmarkDate({ isoDate: movedAt })}</span>
    </span>
  )
}
