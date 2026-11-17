import { and, count, eq, inArray } from 'drizzle-orm'
import type { Card, CardStage } from '@/domain/card/card.entity'
import type { CardPlacement } from '@/domain/card/plan-card-move'
import { ProjectNotFoundError } from '@/domain/project/project.errors'
import type { Database } from '../drizzle.client'
import { cards, projects } from '../schema'

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

export type Executor = Database | Transaction

type AssertProjectExistsParams = {
  executor: Executor
  projectId: string
  shouldLock: boolean
}

export async function assertProjectExists({ executor, projectId, shouldLock }: AssertProjectExistsParams): Promise<void> {
  const query = executor.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId))
  const [project] = shouldLock ? await query.for('update') : await query
  if (!project) throw new ProjectNotFoundError({ projectId })
}

type FindCardParams = {
  executor: Executor
  projectId: string
  cardId: string
}

type FindCardResult = {
  card: Card | null
}

export async function findCard({ executor, projectId, cardId }: FindCardParams): Promise<FindCardResult> {
  const [card] = await executor
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.projectId, projectId)))

  return { card: card ?? null }
}

type ListPlacementsParams = {
  executor: Executor
  projectId: string
  stages: CardStage[]
}

type ListPlacementsResult = {
  placements: CardPlacement[]
}

export async function listPlacements({ executor, projectId, stages }: ListPlacementsParams): Promise<ListPlacementsResult> {
  const placements = await executor
    .select({ id: cards.id, stage: cards.stage, position: cards.position })
    .from(cards)
    .where(and(eq(cards.projectId, projectId), inArray(cards.stage, stages)))

  return { placements }
}

type SavePlacementsParams = {
  executor: Executor
  placements: CardPlacement[]
}

export async function savePlacements({ executor, placements }: SavePlacementsParams): Promise<void> {
  for (const { id, stage, position } of placements) {
    await executor.update(cards).set({ stage, position }).where(eq(cards.id, id))
  }
}

type CloseColumnGapParams = {
  executor: Executor
  projectId: string
  stage: CardStage
}

export async function closeColumnGap({ executor, projectId, stage }: CloseColumnGapParams): Promise<void> {
  const { placements } = await listPlacements({ executor, projectId, stages: [stage] })
  const sorted = placements.toSorted((first, second) => first.position - second.position)
  const changed = sorted
    .map((placement, position) => ({ ...placement, position }))
    .filter((placement, index) => placement.position !== sorted[index]?.position)

  await savePlacements({ executor, placements: changed })
}

type CountColumnCardsParams = {
  executor: Executor
  projectId: string
  stage: CardStage
}

type CountColumnCardsResult = {
  total: number
}

export async function countColumnCards({ executor, projectId, stage }: CountColumnCardsParams): Promise<CountColumnCardsResult> {
  const [column] = await executor
    .select({ total: count() })
    .from(cards)
    .where(and(eq(cards.projectId, projectId), eq(cards.stage, stage)))

  return { total: column?.total ?? 0 }
}
