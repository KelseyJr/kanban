import { CardNotFoundError } from '@/domain/card/card.errors'
import type { CardsRepository, RemoveCardParams } from '@/domain/card/cards.repository'

type DeleteCardUseCaseDependencies = {
  cardsRepository: CardsRepository
}

export class DeleteCardUseCase {
  private readonly cardsRepository: CardsRepository

  constructor({ cardsRepository }: DeleteCardUseCaseDependencies) {
    this.cardsRepository = cardsRepository
  }

  async execute({ projectId, cardId }: RemoveCardParams): Promise<void> {
    const { card } = await this.cardsRepository.remove({ projectId, cardId })
    if (!card) throw new CardNotFoundError({ cardId })
  }
}
