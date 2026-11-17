import type { CardsRepository, ListCardsParams, ListCardsResult } from '@/domain/card/cards.repository'

type ListCardsUseCaseDependencies = {
  cardsRepository: CardsRepository
}

export class ListCardsUseCase {
  private readonly cardsRepository: CardsRepository

  constructor({ cardsRepository }: ListCardsUseCaseDependencies) {
    this.cardsRepository = cardsRepository
  }

  async execute({ projectId }: ListCardsParams): Promise<ListCardsResult> {
    return this.cardsRepository.list({ projectId })
  }
}
