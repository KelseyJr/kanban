import { z } from 'zod'
import type { CreateCardUseCase } from '@/use-cases/create-card/create-card.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { cardDescriptionSchema, cardTitleSchema, projectParamsSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

const bodySchema = z.object({ title: cardTitleSchema, description: cardDescriptionSchema.optional() })

type CreateCardControllerDependencies = {
  createCardUseCase: Pick<CreateCardUseCase, 'execute'>
}

type HandleParams = {
  params: unknown
  body: unknown
}

export class CreateCardController {
  private readonly createCardUseCase: Pick<CreateCardUseCase, 'execute'>

  constructor({ createCardUseCase }: CreateCardControllerDependencies) {
    this.createCardUseCase = createCardUseCase
  }

  async handle({ params, body }: HandleParams): Promise<HttpResponse> {
    const { value: path } = validateRequest({ schema: projectParamsSchema, data: params, target: 'params' })
    const { value: payload } = validateRequest({ schema: bodySchema, data: body, target: 'body' })
    const { card } = await this.createCardUseCase.execute({ projectId: path.projectId, ...payload })

    return { statusCode: HTTP_STATUS.created, body: { card } }
  }
}
