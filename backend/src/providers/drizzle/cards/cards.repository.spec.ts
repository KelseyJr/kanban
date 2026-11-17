import { beforeEach, describe, expect, it } from 'bun:test'
import type { CardStage } from '@/domain/card/card.entity'
import { ProjectNotFoundError } from '@/domain/project/project.errors'
import { resetDatabase, testDatabase } from '@/test/setup-database'
import { DrizzleProjectsRepository } from '../projects/projects.repository'
import { DrizzleCardsRepository } from './cards.repository'

const cardsRepository = new DrizzleCardsRepository({ database: testDatabase })
const projectsRepository = new DrizzleProjectsRepository({ database: testDatabase })

beforeEach(resetDatabase)

type CreateProjectIdParams = {
  name: string
}

async function createProjectId({ name }: CreateProjectIdParams): Promise<string> {
  const { project } = await projectsRepository.create({ name })
  return project.id
}

type CreateCardIdParams = {
  projectId: string
  title: string
}

async function createCardId({ projectId, title }: CreateCardIdParams): Promise<string> {
  const { card } = await cardsRepository.create({ projectId, title })
  return card.id
}

type ReadColumnParams = {
  projectId: string
  stage: CardStage
}

async function readColumn({ projectId, stage }: ReadColumnParams): Promise<string[]> {
  const { cards } = await cardsRepository.list({ projectId })
  const column = cards.filter((card) => card.stage === stage)
  expect(column.map((card) => card.position)).toEqual(column.map((_, index) => index))
  return column.map((card) => card.title)
}

describe('create', () => {
  it('creates cards at the end of the backlog with an empty description by default', async () => {
    const projectId = await createProjectId({ name: 'kanban' })

    const { card } = await cardsRepository.create({ projectId, title: 'A' })
    await cardsRepository.create({ projectId, title: 'B' })

    expect(card).toMatchObject({ stage: 'backlog', position: 0, description: '' })
    expect(await readColumn({ projectId, stage: 'backlog' })).toEqual(['A', 'B'])
  })

  it('throws ProjectNotFoundError for a project that does not exist', async () => {
    const creation = cardsRepository.create({ projectId: crypto.randomUUID(), title: 'A' })

    await expect(creation).rejects.toBeInstanceOf(ProjectNotFoundError)
  })
})

describe('list', () => {
  it('lists only the cards of the project, by stage order and position', async () => {
    const projectId = await createProjectId({ name: 'kanban' })
    const otherProjectId = await createProjectId({ name: 'site' })
    const cardAId = await createCardId({ projectId, title: 'A' })
    const cardBId = await createCardId({ projectId, title: 'B' })
    await createCardId({ projectId: otherProjectId, title: 'other' })
    await cardsRepository.move({ projectId, cardId: cardAId, stage: 'archive', position: 0 })
    await cardsRepository.move({ projectId, cardId: cardBId, stage: 'explore', position: 0 })

    const { cards } = await cardsRepository.list({ projectId })

    expect(cards.map((card) => [card.title, card.stage])).toEqual([
      ['B', 'explore'],
      ['A', 'archive'],
    ])
  })

  it('throws ProjectNotFoundError for a project that does not exist', async () => {
    const listing = cardsRepository.list({ projectId: crypto.randomUUID() })

    await expect(listing).rejects.toBeInstanceOf(ProjectNotFoundError)
  })
})

describe('update', () => {
  it('changes title and description without moving the card', async () => {
    const projectId = await createProjectId({ name: 'kanban' })
    await createCardId({ projectId, title: 'A' })
    const cardBId = await createCardId({ projectId, title: 'B' })

    const { card } = await cardsRepository.update({ projectId, cardId: cardBId, title: 'B2', description: 'detalhes' })

    expect(card).toMatchObject({ title: 'B2', description: 'detalhes', stage: 'backlog', position: 1 })
  })

  it('returns null when the card belongs to another project', async () => {
    const projectId = await createProjectId({ name: 'kanban' })
    const otherProjectId = await createProjectId({ name: 'site' })
    const cardAId = await createCardId({ projectId, title: 'A' })

    const { card } = await cardsRepository.update({ projectId: otherProjectId, cardId: cardAId, title: 'X' })

    expect(card).toBeNull()
    expect(await readColumn({ projectId, stage: 'backlog' })).toEqual(['A'])
  })
})

describe('remove', () => {
  it('deletes the card and closes the gap in its column', async () => {
    const projectId = await createProjectId({ name: 'kanban' })
    await createCardId({ projectId, title: 'A' })
    const cardBId = await createCardId({ projectId, title: 'B' })
    await createCardId({ projectId, title: 'C' })

    await cardsRepository.remove({ projectId, cardId: cardBId })

    expect(await readColumn({ projectId, stage: 'backlog' })).toEqual(['A', 'C'])
  })

  it('returns null when the card belongs to another project', async () => {
    const projectId = await createProjectId({ name: 'kanban' })
    const otherProjectId = await createProjectId({ name: 'site' })
    const cardAId = await createCardId({ projectId, title: 'A' })

    const { card } = await cardsRepository.remove({ projectId: otherProjectId, cardId: cardAId })

    expect(card).toBeNull()
    expect(await readColumn({ projectId, stage: 'backlog' })).toEqual(['A'])
  })
})

describe('move', () => {
  it('moves a card to another column at the chosen position, without gaps', async () => {
    const projectId = await createProjectId({ name: 'kanban' })
    const cardAId = await createCardId({ projectId, title: 'A' })
    await createCardId({ projectId, title: 'B' })
    const cardXId = await createCardId({ projectId, title: 'X' })
    await cardsRepository.move({ projectId, cardId: cardXId, stage: 'explore', position: 0 })

    const { card } = await cardsRepository.move({ projectId, cardId: cardAId, stage: 'explore', position: 1 })

    expect(card).toMatchObject({ stage: 'explore', position: 1 })
    expect(await readColumn({ projectId, stage: 'backlog' })).toEqual(['B'])
    expect(await readColumn({ projectId, stage: 'explore' })).toEqual(['X', 'A'])
  })

  it('reorders a card within its own column', async () => {
    const projectId = await createProjectId({ name: 'kanban' })
    await createCardId({ projectId, title: 'A' })
    await createCardId({ projectId, title: 'B' })
    const cardCId = await createCardId({ projectId, title: 'C' })

    await cardsRepository.move({ projectId, cardId: cardCId, stage: 'backlog', position: 0 })

    expect(await readColumn({ projectId, stage: 'backlog' })).toEqual(['C', 'A', 'B'])
  })

  it('returns null when the card belongs to another project and changes nothing', async () => {
    const projectId = await createProjectId({ name: 'kanban' })
    const otherProjectId = await createProjectId({ name: 'site' })
    const cardAId = await createCardId({ projectId, title: 'A' })

    const { card } = await cardsRepository.move({ projectId: otherProjectId, cardId: cardAId, stage: 'apply', position: 0 })

    expect(card).toBeNull()
    expect(await readColumn({ projectId, stage: 'backlog' })).toEqual(['A'])
  })

  it('throws ProjectNotFoundError for a project that does not exist', async () => {
    const movement = cardsRepository.move({
      projectId: crypto.randomUUID(),
      cardId: crypto.randomUUID(),
      stage: 'apply',
      position: 0,
    })

    await expect(movement).rejects.toBeInstanceOf(ProjectNotFoundError)
  })
})
