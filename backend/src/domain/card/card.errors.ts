type CardNotFoundErrorParams = {
  cardId: string
}

export class CardNotFoundError extends Error {
  override name = 'CardNotFoundError'

  constructor({ cardId }: CardNotFoundErrorParams) {
    super(`Card ${cardId} not found`)
  }
}
