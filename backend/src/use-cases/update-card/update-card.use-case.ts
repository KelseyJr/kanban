import { CardNotFoundError } from '@/domain/card/card.errors'
import type { CardsRepository, UpdateCardParams } from '@/domain/card/cards.repository'
import type { Card } from '@/domain/card/card.entity'

type UpdateCardUseCaseDependencies = {
  cardsRepository: CardsRepository
}

type UpdateCardResult = {
  card: Card
}

export class UpdateCardUseCase {
  private readonly cardsRepository: CardsRepository

  constructor({ cardsRepository }: UpdateCardUseCaseDependencies) {
    this.cardsRepository = cardsRepository
  }

  async execute({ projectId, cardId, title, description }: UpdateCardParams): Promise<UpdateCardResult> {
    const { card } = await this.cardsRepository.update({ projectId, cardId, title, description })
    if (!card) throw new CardNotFoundError({ cardId })

    return { card }
  }
}
