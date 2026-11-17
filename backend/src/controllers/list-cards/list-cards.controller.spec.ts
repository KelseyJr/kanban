import { describe, expect, it, mock } from 'bun:test'
import { buildCard } from '@/test/fixtures'
import { RequestValidationError } from '../request-validation'
import { ListCardsController } from './list-cards.controller'

const PROJECT_ID = '0b9b3c0e-6f0f-4f8e-9a53-0d6f1b2c3d4e'

describe('ListCardsController', () => {
  it('answers 200 with the cards of the project', async () => {
    const card = buildCard()
    const listCardsUseCase = { execute: mock(async () => ({ cards: [card] })) }
    const listCardsController = new ListCardsController({ listCardsUseCase })

    const response = await listCardsController.handle({ params: { projectId: PROJECT_ID } })

    expect(listCardsUseCase.execute).toHaveBeenCalledWith({ projectId: PROJECT_ID })
    expect(response).toEqual({ statusCode: 200, body: { cards: [card] } })
  })

  it('rejects a malformed project id', async () => {
    const listCardsUseCase = { execute: mock(async () => ({ cards: [] })) }
    const listCardsController = new ListCardsController({ listCardsUseCase })

    const handling = listCardsController.handle({ params: { projectId: 'abc' } })

    await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
  })
})
