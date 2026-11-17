import { describe, expect, it, mock } from 'bun:test'
import { CardNotFoundError } from '@/domain/card/card.errors'
import { buildCard, buildCardsRepository } from '@/test/fixtures'
import { UpdateCardUseCase } from './update-card.use-case'

describe('UpdateCardUseCase', () => {
  it('updates the card through the repository', async () => {
    const card = buildCard({ overrides: { title: 'A revisado' } })
    const cardsRepository = buildCardsRepository({ overrides: { update: mock(async () => ({ card })) } })
    const updateCardUseCase = new UpdateCardUseCase({ cardsRepository })

    const result = await updateCardUseCase.execute({ projectId: 'project-1', cardId: card.id, title: 'A revisado' })

    expect(cardsRepository.update).toHaveBeenCalledWith({
      projectId: 'project-1',
      cardId: card.id,
      title: 'A revisado',
      description: undefined,
    })
    expect(result).toEqual({ card })
  })

  it('throws CardNotFoundError when the card is not in the project', async () => {
    const updateCardUseCase = new UpdateCardUseCase({ cardsRepository: buildCardsRepository() })

    const execution = updateCardUseCase.execute({ projectId: 'project-1', cardId: 'missing', title: 'X' })

    await expect(execution).rejects.toBeInstanceOf(CardNotFoundError)
  })
})
