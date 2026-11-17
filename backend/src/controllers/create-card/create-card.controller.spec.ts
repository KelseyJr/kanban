import { describe, expect, it, mock } from 'bun:test'
import { buildCard } from '@/test/fixtures'
import { RequestValidationError } from '../request-validation'
import { CreateCardController } from './create-card.controller'

const PROJECT_ID = '0b9b3c0e-6f0f-4f8e-9a53-0d6f1b2c3d4e'
const MAX_TITLE_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 5000

describe('CreateCardController', () => {
  it('answers 201 and trims the title before calling the use case', async () => {
    const card = buildCard({ overrides: { title: 'CI' } })
    const createCardUseCase = { execute: mock(async () => ({ card })) }
    const createCardController = new CreateCardController({ createCardUseCase })

    const response = await createCardController.handle({ params: { projectId: PROJECT_ID }, body: { title: '  CI  ' } })

    expect(createCardUseCase.execute).toHaveBeenCalledWith({ projectId: PROJECT_ID, title: 'CI' })
    expect(response).toEqual({ statusCode: 201, body: { card } })
  })

  it('accepts the maximum title and description lengths', async () => {
    const createCardUseCase = { execute: mock(async () => ({ card: buildCard() })) }
    const createCardController = new CreateCardController({ createCardUseCase })
    const body = { title: 'a'.repeat(MAX_TITLE_LENGTH), description: 'd'.repeat(MAX_DESCRIPTION_LENGTH) }

    const response = await createCardController.handle({ params: { projectId: PROJECT_ID }, body })

    expect(response.statusCode).toBe(201)
  })

  it.each([
    ['a blank title', { title: '   ' }],
    ['a title over the limit', { title: 'a'.repeat(MAX_TITLE_LENGTH + 1) }],
    ['a description over the limit', { title: 'A', description: 'd'.repeat(MAX_DESCRIPTION_LENGTH + 1) }],
    ['no title', {}],
  ])('rejects %s without calling the use case', async (_, body) => {
    const createCardUseCase = { execute: mock(async () => ({ card: buildCard() })) }
    const createCardController = new CreateCardController({ createCardUseCase })

    const handling = createCardController.handle({ params: { projectId: PROJECT_ID }, body })

    await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
    expect(createCardUseCase.execute).not.toHaveBeenCalled()
  })
})
