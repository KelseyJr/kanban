import { z } from 'zod'
import type { UpdateCardUseCase } from '@/use-cases/update-card/update-card.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { cardDescriptionSchema, cardParamsSchema, cardTitleSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

const bodySchema = z
  .object({ title: cardTitleSchema.optional(), description: cardDescriptionSchema.optional() })
  .refine((body) => body.title !== undefined || body.description !== undefined, {
    error: 'Informe o título ou a descrição do card.',
  })

type UpdateCardControllerDependencies = {
  updateCardUseCase: Pick<UpdateCardUseCase, 'execute'>
}

type HandleParams = {
  params: unknown
  body: unknown
}

export class UpdateCardController {
  private readonly updateCardUseCase: Pick<UpdateCardUseCase, 'execute'>

  constructor({ updateCardUseCase }: UpdateCardControllerDependencies) {
    this.updateCardUseCase = updateCardUseCase
  }

  async handle({ params, body }: HandleParams): Promise<HttpResponse> {
    const { value: path } = validateRequest({ schema: cardParamsSchema, data: params, target: 'params' })
    const { value: payload } = validateRequest({ schema: bodySchema, data: body, target: 'body' })
    const { card } = await this.updateCardUseCase.execute({ ...path, ...payload })

    return { statusCode: HTTP_STATUS.ok, body: { card } }
  }
}
