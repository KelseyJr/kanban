import type { GetProjectUseCase } from '@/use-cases/get-project/get-project.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { projectParamsSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

type GetProjectControllerDependencies = {
  getProjectUseCase: Pick<GetProjectUseCase, 'execute'>
}

type HandleParams = {
  params: unknown
}

export class GetProjectController {
  private readonly getProjectUseCase: Pick<GetProjectUseCase, 'execute'>

  constructor({ getProjectUseCase }: GetProjectControllerDependencies) {
    this.getProjectUseCase = getProjectUseCase
  }

  async handle({ params }: HandleParams): Promise<HttpResponse> {
    const { value } = validateRequest({ schema: projectParamsSchema, data: params, target: 'params' })
    const { project } = await this.getProjectUseCase.execute({ projectId: value.projectId })

    return { statusCode: HTTP_STATUS.ok, body: { project } }
  }
}
