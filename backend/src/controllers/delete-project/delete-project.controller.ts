import type { DeleteProjectUseCase } from '@/use-cases/delete-project/delete-project.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { projectParamsSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

type DeleteProjectControllerDependencies = {
  deleteProjectUseCase: Pick<DeleteProjectUseCase, 'execute'>
}

type HandleParams = {
  params: unknown
}

export class DeleteProjectController {
  private readonly deleteProjectUseCase: Pick<DeleteProjectUseCase, 'execute'>

  constructor({ deleteProjectUseCase }: DeleteProjectControllerDependencies) {
    this.deleteProjectUseCase = deleteProjectUseCase
  }

  async handle({ params }: HandleParams): Promise<HttpResponse> {
    const { value } = validateRequest({ schema: projectParamsSchema, data: params, target: 'params' })
    await this.deleteProjectUseCase.execute({ projectId: value.projectId })

    return { statusCode: HTTP_STATUS.noContent }
  }
}
