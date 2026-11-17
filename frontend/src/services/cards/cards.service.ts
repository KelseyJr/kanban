import { z } from 'zod'
import { type Card, type CardStage, cardSchema } from '@/types/card'
import { requestJson } from '@/services/api.client'

const cardResponseSchema = z.object({ card: cardSchema })
const cardListResponseSchema = z.object({ cards: z.array(cardSchema) })

type CardResult = {
  card: Card
}

type ListCardsParams = {
  projectId: string
}

type ListCardsResult = {
  cards: Card[]
}

export async function listCards({ projectId }: ListCardsParams): Promise<ListCardsResult> {
  const { data } = await requestJson({ path: `/projects/${projectId}/cards`, schema: cardListResponseSchema })
  return data
}

type CreateCardParams = {
  projectId: string
  title: string
  description: string
}

export async function createCard({ projectId, title, description }: CreateCardParams): Promise<CardResult> {
  const path = `/projects/${projectId}/cards`
  const { data } = await requestJson({ path, method: 'POST', body: { title, description }, schema: cardResponseSchema })
  return data
}

type UpdateCardParams = {
  projectId: string
  cardId: string
  title: string
  description: string
}

export async function updateCard({ projectId, cardId, title, description }: UpdateCardParams): Promise<CardResult> {
  const path = `/projects/${projectId}/cards/${cardId}`
  const { data } = await requestJson({ path, method: 'PATCH', body: { title, description }, schema: cardResponseSchema })
  return data
}

type DeleteCardParams = {
  projectId: string
  cardId: string
}

export async function deleteCard({ projectId, cardId }: DeleteCardParams): Promise<void> {
  await requestJson({ path: `/projects/${projectId}/cards/${cardId}`, method: 'DELETE', schema: z.undefined() })
}

type MoveCardParams = {
  projectId: string
  cardId: string
  stage: CardStage
  position: number
}

export async function moveCard({ projectId, cardId, stage, position }: MoveCardParams): Promise<CardResult> {
  const path = `/projects/${projectId}/cards/${cardId}/move`
  const { data } = await requestJson({ path, method: 'POST', body: { stage, position }, schema: cardResponseSchema })
  return data
}
