import { describe, expect, it, mock } from 'bun:test'
import { CardNotFoundError } from '@/domain/card/card.errors'
import { buildCard, buildCardsRepository } from '@/test/fixtures'
import { DeleteCardUseCase } from './delete-card.use-case'

describe('DeleteCardUseCase', () => {
  it('removes the card through the repository', async () => {
    const card = buildCard()
    const cardsRepository = buildCardsRepository({ overrides: { remove: mock(async () => ({ card })) } })
    const deleteCardUseCase = new DeleteCardUseCase({ cardsRepository })

    await deleteCardUseCase.execute({ projectId: 'project-1', cardId: card.id })

    expect(cardsRepository.remove).toHaveBeenCalledWith({ projectId: 'project-1', cardId: card.id })
  })

  it('throws CardNotFoundError when the card is not in the project', async () => {
    const deleteCardUseCase = new DeleteCardUseCase({ cardsRepository: buildCardsRepository() })

    const execution = deleteCardUseCase.execute({ projectId: 'project-1', cardId: 'missing' })

    await expect(execution).rejects.toBeInstanceOf(CardNotFoundError)
  })
})
