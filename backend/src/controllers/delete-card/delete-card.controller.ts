import type { DeleteCardUseCase } from '@/use-cases/delete-card/delete-card.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { cardParamsSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

type DeleteCardControllerDependencies = {
  deleteCardUseCase: Pick<DeleteCardUseCase, 'execute'>
}

type HandleParams = {
  params: unknown
}

export class DeleteCardController {
  private readonly deleteCardUseCase: Pick<DeleteCardUseCase, 'execute'>

  constructor({ deleteCardUseCase }: DeleteCardControllerDependencies) {
    this.deleteCardUseCase = deleteCardUseCase
  }

  async handle({ params }: HandleParams): Promise<HttpResponse> {
    const { value } = validateRequest({ schema: cardParamsSchema, data: params, target: 'params' })
    await this.deleteCardUseCase.execute(value)

    return { statusCode: HTTP_STATUS.noContent }
  }
}
