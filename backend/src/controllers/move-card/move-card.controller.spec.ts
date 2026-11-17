import { describe, expect, it, mock } from 'bun:test'
import { buildCard } from '@/test/fixtures'
import { RequestValidationError } from '../request-validation'
import { MoveCardController } from './move-card.controller'

const PARAMS = { projectId: '0b9b3c0e-6f0f-4f8e-9a53-0d6f1b2c3d4e', cardId: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f' }

describe('MoveCardController', () => {
  it('answers 200 with the moved card', async () => {
    const card = buildCard({ overrides: { stage: 'apply', position: 2 } })
    const moveCardUseCase = { execute: mock(async () => ({ card })) }
    const moveCardController = new MoveCardController({ moveCardUseCase })

    const response = await moveCardController.handle({ params: PARAMS, body: { stage: 'apply', position: 2 } })

    expect(moveCardUseCase.execute).toHaveBeenCalledWith({ ...PARAMS, stage: 'apply', position: 2 })
    expect(response).toEqual({ statusCode: 200, body: { card } })
  })

  it.each([
    ['an unknown stage', { stage: 'done', position: 0 }],
    ['a negative position', { stage: 'apply', position: -1 }],
    ['a fractional position', { stage: 'apply', position: 0.5 }],
  ])('rejects %s without calling the use case', async (_, body) => {
    const moveCardUseCase = { execute: mock(async () => ({ card: buildCard() })) }
    const moveCardController = new MoveCardController({ moveCardUseCase })

    const handling = moveCardController.handle({ params: PARAMS, body })

    await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
    expect(moveCardUseCase.execute).not.toHaveBeenCalled()
  })
})
