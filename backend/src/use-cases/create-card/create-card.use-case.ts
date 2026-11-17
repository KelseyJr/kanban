import type { CardsRepository, CreateCardParams, CreateCardResult } from '@/domain/card/cards.repository'

type CreateCardUseCaseDependencies = {
  cardsRepository: CardsRepository
}

export class CreateCardUseCase {
  private readonly cardsRepository: CardsRepository

  constructor({ cardsRepository }: CreateCardUseCaseDependencies) {
    this.cardsRepository = cardsRepository
  }

  async execute({ projectId, title, description }: CreateCardParams): Promise<CreateCardResult> {
    return this.cardsRepository.create({ projectId, title, description })
  }
}
