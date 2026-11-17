import { and, asc, eq } from 'drizzle-orm'
import { CARD_STAGE } from '@/domain/card/card.entity'
import type {
  CardsRepository,
  CreateCardParams,
  CreateCardResult,
  ListCardsParams,
  ListCardsResult,
  MoveCardParams,
  MoveCardResult,
  RemoveCardParams,
  RemoveCardResult,
  UpdateCardParams,
  UpdateCardResult,
} from '@/domain/card/cards.repository'
import { planCardMove } from '@/domain/card/plan-card-move'
import type { Database } from '../drizzle.client'
import { cards } from '../schema'
import {
  assertProjectExists,
  closeColumnGap,
  countColumnCards,
  findCard,
  listPlacements,
  savePlacements,
} from './card-queries'

type DrizzleCardsRepositoryDependencies = {
  database: Database
}

export class DrizzleCardsRepository implements CardsRepository {
  private readonly database: Database

  constructor({ database }: DrizzleCardsRepositoryDependencies) {
    this.database = database
  }

  async list({ projectId }: ListCardsParams): Promise<ListCardsResult> {
    await assertProjectExists({ executor: this.database, projectId, shouldLock: false })
    const rows = await this.database
      .select()
      .from(cards)
      .where(eq(cards.projectId, projectId))
      .orderBy(asc(cards.stage), asc(cards.position))

    return { cards: rows }
  }

  async create({ projectId, title, description }: CreateCardParams): Promise<CreateCardResult> {
    return this.database.transaction(async (executor) => {
      await assertProjectExists({ executor, projectId, shouldLock: true })
      const { total } = await countColumnCards({ executor, projectId, stage: CARD_STAGE.backlog })
      const [card] = await executor
        .insert(cards)
        .values({ projectId, title, description, stage: CARD_STAGE.backlog, position: total })
        .returning()
      if (!card) throw new Error(`Card ${title} was not returned after the insert`)

      return { card }
    })
  }

  async update({ projectId, cardId, title, description }: UpdateCardParams): Promise<UpdateCardResult> {
    const [card] = await this.database
      .update(cards)
      .set({ title, description })
      .where(and(eq(cards.id, cardId), eq(cards.projectId, projectId)))
      .returning()

    return { card: card ?? null }
  }

  async remove({ projectId, cardId }: RemoveCardParams): Promise<RemoveCardResult> {
    return this.database.transaction(async (executor) => {
      await assertProjectExists({ executor, projectId, shouldLock: true })
      const [card] = await executor
        .delete(cards)
        .where(and(eq(cards.id, cardId), eq(cards.projectId, projectId)))
        .returning()
      if (card) await closeColumnGap({ executor, projectId, stage: card.stage })

      return { card: card ?? null }
    })
  }

  async move({ projectId, cardId, stage, position }: MoveCardParams): Promise<MoveCardResult> {
    return this.database.transaction(async (executor) => {
      await assertProjectExists({ executor, projectId, shouldLock: true })
      const { card } = await findCard({ executor, projectId, cardId })
      if (!card) return { card: null }

      const { placements } = await listPlacements({ executor, projectId, stages: [card.stage, stage] })
      const { changes } = planCardMove({ cards: placements, cardId, toStage: stage, toPosition: position })
      await savePlacements({ executor, placements: changes })

      return findCard({ executor, projectId, cardId })
    })
  }
}
