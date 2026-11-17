import type { Card, CardStage } from './card.entity'

export type ListCardsParams = {
  projectId: string
}

export type ListCardsResult = {
  cards: Card[]
}

export type CreateCardParams = {
  projectId: string
  title: string
  description?: string
}

export type CreateCardResult = {
  card: Card
}

export type UpdateCardParams = {
  projectId: string
  cardId: string
  title?: string
  description?: string
}

export type UpdateCardResult = {
  card: Card | null
}

export type RemoveCardParams = {
  projectId: string
  cardId: string
}

export type RemoveCardResult = {
  card: Card | null
}

export type MoveCardParams = {
  projectId: string
  cardId: string
  stage: CardStage
  position: number
}

export type MoveCardResult = {
  card: Card | null
}

export type CardsRepository = {
  list: (params: ListCardsParams) => Promise<ListCardsResult>
  create: (params: CreateCardParams) => Promise<CreateCardResult>
  update: (params: UpdateCardParams) => Promise<UpdateCardResult>
  remove: (params: RemoveCardParams) => Promise<RemoveCardResult>
  move: (params: MoveCardParams) => Promise<MoveCardResult>
}
