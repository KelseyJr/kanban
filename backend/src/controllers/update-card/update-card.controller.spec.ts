import { describe, expect, it, mock } from 'bun:test'
import { buildCard } from '@/test/fixtures'
import { RequestValidationError } from '../request-validation'
import { UpdateCardController } from './update-card.controller'

const PARAMS = { projectId: '0b9b3c0e-6f0f-4f8e-9a53-0d6f1b2c3d4e', cardId: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f' }

describe('UpdateCardController', () => {
  it('answers 200 with the updated card', async () => {
    const card = buildCard({ overrides: { title: 'A revisado' } })
    const updateCardUseCase = { execute: mock(async () => ({ card })) }
    const updateCardController = new UpdateCardController({ updateCardUseCase })

    const response = await updateCardController.handle({ params: PARAMS, body: { title: 'A revisado' } })

    expect(updateCardUseCase.execute).toHaveBeenCalledWith({ ...PARAMS, title: 'A revisado' })
    expect(response).toEqual({ statusCode: 200, body: { card } })
  })

  it.each([
    ['a blank title', { title: ' ' }],
    ['an empty body', {}],
  ])('rejects %s without calling the use case', async (_, body) => {
    const updateCardUseCase = { execute: mock(async () => ({ card: buildCard() })) }
    const updateCardController = new UpdateCardController({ updateCardUseCase })

    const handling = updateCardController.handle({ params: PARAMS, body })

    await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
    expect(updateCardUseCase.execute).not.toHaveBeenCalled()
  })

  it('rejects a malformed card id', async () => {
    const updateCardUseCase = { execute: mock(async () => ({ card: buildCard() })) }
    const updateCardController = new UpdateCardController({ updateCardUseCase })

    const handling = updateCardController.handle({ params: { ...PARAMS, cardId: 'abc' }, body: { title: 'X' } })

    await expect(handling).rejects.toMatchObject({ target: 'params' })
  })
})
