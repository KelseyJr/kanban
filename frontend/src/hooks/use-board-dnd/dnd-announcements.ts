import type { Announcements, ScreenReaderInstructions, UniqueIdentifier } from '@dnd-kit/core'
import { CARD_STAGE_LABELS, type Card, ORDERED_CARD_STAGES } from '@/types/card'

export const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'Para pegar um card, pressione espaço ou enter. Use as setas para levá-lo a outra posição ou coluna, espaço ou enter para soltar e escape para cancelar.',
}

type DescribeTargetParams = {
  id: UniqueIdentifier
  cards: readonly Card[]
}

function describeTarget({ id, cards }: DescribeTargetParams): string {
  const stage = ORDERED_CARD_STAGES.find((candidate) => candidate === id)
  if (stage) return `a coluna ${CARD_STAGE_LABELS[stage]}`

  const card = cards.find((candidate) => candidate.id === id)
  return card ? `o card ${card.title} em ${CARD_STAGE_LABELS[card.stage]}` : 'uma área fora do quadro'
}

type TitleOfParams = {
  id: UniqueIdentifier
}

type CreateAnnouncementsParams = {
  cards: readonly Card[]
}

export function createAnnouncements({ cards }: CreateAnnouncementsParams): Announcements {
  const titleOf = ({ id }: TitleOfParams): string => cards.find((card) => card.id === id)?.title ?? 'card'

  return {
    onDragStart: ({ active }) => `Card ${titleOf({ id: active.id })} pego.`,
    onDragOver: ({ active, over }) =>
      over ? `Card ${titleOf({ id: active.id })} sobre ${describeTarget({ id: over.id, cards })}.` : `Card ${titleOf({ id: active.id })} fora do quadro.`,
    onDragEnd: ({ active, over }) =>
      over ? `Card ${titleOf({ id: active.id })} solto sobre ${describeTarget({ id: over.id, cards })}.` : `Card ${titleOf({ id: active.id })} solto fora do quadro.`,
    onDragCancel: ({ active }) => `Movimento do card ${titleOf({ id: active.id })} cancelado.`,
  }
}
