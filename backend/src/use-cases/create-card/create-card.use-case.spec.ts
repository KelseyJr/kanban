import { describe, expect, it, mock } from 'bun:test'
import { ProjectNotFoundError } from '@/domain/project/project.errors'
import { buildCard, buildCardsRepository } from '@/test/fixtures'
import { CreateCardUseCase } from './create-card.use-case'

describe('CreateCardUseCase', () => {
  it('creates the card through the repository', async () => {
    const card = buildCard({ overrides: { title: 'CI' } })
    const cardsRepository = buildCardsRepository({ overrides: { create: mock(async () => ({ card })) } })
    const createCardUseCase = new CreateCardUseCase({ cardsRepository })

    const result = await createCardUseCase.execute({ projectId: 'project-1', title: 'CI', description: 'pipeline' })

    expect(cardsRepository.create).toHaveBeenCalledWith({ projectId: 'project-1', title: 'CI', description: 'pipeline' })
    expect(result).toEqual({ card })
  })

  it('lets ProjectNotFoundError propagate when the project does not exist', async () => {
    const create = mock(async () => {
      throw new ProjectNotFoundError({ projectId: 'missing' })
    })
    const createCardUseCase = new CreateCardUseCase({ cardsRepository: buildCardsRepository({ overrides: { create } }) })

    const execution = createCardUseCase.execute({ projectId: 'missing', title: 'A' })

    await expect(execution).rejects.toBeInstanceOf(ProjectNotFoundError)
  })
})
