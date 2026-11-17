import { describe, expect, it, mock } from 'bun:test'
import { CardNotFoundError } from '@/domain/card/card.errors'
import { buildCard, buildCardsRepository } from '@/test/fixtures'
import { MoveCardUseCase } from './move-card.use-case'

describe('MoveCardUseCase', () => {
  it('moves the card through the repository', async () => {
    const card = buildCard({ overrides: { stage: 'apply', position: 1 } })
    const cardsRepository = buildCardsRepository({ overrides: { move: mock(async () => ({ card })) } })
    const moveCardUseCase = new MoveCardUseCase({ cardsRepository })

    const result = await moveCardUseCase.execute({ projectId: 'project-1', cardId: card.id, stage: 'apply', position: 1 })

    expect(cardsRepository.move).toHaveBeenCalledWith({ projectId: 'project-1', cardId: card.id, stage: 'apply', position: 1 })
    expect(result).toEqual({ card })
  })

  it('throws CardNotFoundError when the card is not in the project', async () => {
    const moveCardUseCase = new MoveCardUseCase({ cardsRepository: buildCardsRepository() })

    const execution = moveCardUseCase.execute({ projectId: 'project-1', cardId: 'missing', stage: 'apply', position: 0 })

    await expect(execution).rejects.toBeInstanceOf(CardNotFoundError)
  })
})
