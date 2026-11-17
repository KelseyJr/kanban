import { describe, expect, it, mock } from 'bun:test'
import { RequestValidationError } from '../request-validation'
import { DeleteCardController } from './delete-card.controller'

const PARAMS = { projectId: '0b9b3c0e-6f0f-4f8e-9a53-0d6f1b2c3d4e', cardId: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f' }

describe('DeleteCardController', () => {
  it('answers 204 with no body after deleting the card', async () => {
    const deleteCardUseCase = { execute: mock(async () => undefined) }
    const deleteCardController = new DeleteCardController({ deleteCardUseCase })

    const response = await deleteCardController.handle({ params: PARAMS })

    expect(deleteCardUseCase.execute).toHaveBeenCalledWith(PARAMS)
    expect(response).toEqual({ statusCode: 204 })
  })

  it('rejects a malformed project id without calling the use case', async () => {
    const deleteCardUseCase = { execute: mock(async () => undefined) }
    const deleteCardController = new DeleteCardController({ deleteCardUseCase })

    const handling = deleteCardController.handle({ params: { ...PARAMS, projectId: '1' } })

    await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
    expect(deleteCardUseCase.execute).not.toHaveBeenCalled()
  })
})
