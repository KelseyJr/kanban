import { describe, expect, it, mock } from 'bun:test'
import { ProjectNotFoundError } from '@/domain/project/project.errors'
import { buildCard, buildCardsRepository } from '@/test/fixtures'
import { ListCardsUseCase } from './list-cards.use-case'

describe('ListCardsUseCase', () => {
  it('returns the cards of the project', async () => {
    const card = buildCard()
    const cardsRepository = buildCardsRepository({ overrides: { list: mock(async () => ({ cards: [card] })) } })
    const listCardsUseCase = new ListCardsUseCase({ cardsRepository })

    const result = await listCardsUseCase.execute({ projectId: 'project-1' })

    expect(cardsRepository.list).toHaveBeenCalledWith({ projectId: 'project-1' })
    expect(result).toEqual({ cards: [card] })
  })

  it('lets ProjectNotFoundError propagate when the project does not exist', async () => {
    const list = mock(async () => {
      throw new ProjectNotFoundError({ projectId: 'missing' })
    })
    const listCardsUseCase = new ListCardsUseCase({ cardsRepository: buildCardsRepository({ overrides: { list } }) })

    const execution = listCardsUseCase.execute({ projectId: 'missing' })

    await expect(execution).rejects.toBeInstanceOf(ProjectNotFoundError)
  })
})
