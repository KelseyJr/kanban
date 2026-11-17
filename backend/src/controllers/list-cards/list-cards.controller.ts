import type { ListCardsUseCase } from '@/use-cases/list-cards/list-cards.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { projectParamsSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

type ListCardsControllerDependencies = {
  listCardsUseCase: Pick<ListCardsUseCase, 'execute'>
}

type HandleParams = {
  params: unknown
}

export class ListCardsController {
  private readonly listCardsUseCase: Pick<ListCardsUseCase, 'execute'>

  constructor({ listCardsUseCase }: ListCardsControllerDependencies) {
    this.listCardsUseCase = listCardsUseCase
  }

  async handle({ params }: HandleParams): Promise<HttpResponse> {
    const { value } = validateRequest({ schema: projectParamsSchema, data: params, target: 'params' })
    const { cards } = await this.listCardsUseCase.execute({ projectId: value.projectId })

    return { statusCode: HTTP_STATUS.ok, body: { cards } }
  }
}
