import { z } from 'zod'
import type { MoveCardUseCase } from '@/use-cases/move-card/move-card.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { cardParamsSchema, cardPositionSchema, cardStageSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

const bodySchema = z.object({ stage: cardStageSchema, position: cardPositionSchema })

type MoveCardControllerDependencies = {
  moveCardUseCase: Pick<MoveCardUseCase, 'execute'>
}

type HandleParams = {
  params: unknown
  body: unknown
}

export class MoveCardController {
  private readonly moveCardUseCase: Pick<MoveCardUseCase, 'execute'>

  constructor({ moveCardUseCase }: MoveCardControllerDependencies) {
    this.moveCardUseCase = moveCardUseCase
  }

  async handle({ params, body }: HandleParams): Promise<HttpResponse> {
    const { value: path } = validateRequest({ schema: cardParamsSchema, data: params, target: 'params' })
    const { value: payload } = validateRequest({ schema: bodySchema, data: body, target: 'body' })
    const { card } = await this.moveCardUseCase.execute({ ...path, ...payload })

    return { statusCode: HTTP_STATUS.ok, body: { card } }
  }
}
