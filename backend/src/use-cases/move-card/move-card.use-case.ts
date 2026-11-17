import type { Card } from '@/domain/card/card.entity'
import { CardNotFoundError } from '@/domain/card/card.errors'
import type { CardsRepository, MoveCardParams } from '@/domain/card/cards.repository'

type MoveCardUseCaseDependencies = {
  cardsRepository: CardsRepository
}

type MoveCardResult = {
  card: Card
}

export class MoveCardUseCase {
  private readonly cardsRepository: CardsRepository

  constructor({ cardsRepository }: MoveCardUseCaseDependencies) {
    this.cardsRepository = cardsRepository
  }

  async execute({ projectId, cardId, stage, position }: MoveCardParams): Promise<MoveCardResult> {
    const { card } = await this.cardsRepository.move({ projectId, cardId, stage, position })
    if (!card) throw new CardNotFoundError({ cardId })

    return { card }
  }
}
