import { z } from 'zod'
import type { RenameProjectUseCase } from '@/use-cases/rename-project/rename-project.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { projectNameSchema, projectParamsSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

const bodySchema = z.object({ name: projectNameSchema })

type RenameProjectControllerDependencies = {
  renameProjectUseCase: Pick<RenameProjectUseCase, 'execute'>
}

type HandleParams = {
  params: unknown
  body: unknown
}

export class RenameProjectController {
  private readonly renameProjectUseCase: Pick<RenameProjectUseCase, 'execute'>

  constructor({ renameProjectUseCase }: RenameProjectControllerDependencies) {
    this.renameProjectUseCase = renameProjectUseCase
  }

  async handle({ params, body }: HandleParams): Promise<HttpResponse> {
    const { value: path } = validateRequest({ schema: projectParamsSchema, data: params, target: 'params' })
    const { value: payload } = validateRequest({ schema: bodySchema, data: body, target: 'body' })
    const { project } = await this.renameProjectUseCase.execute({ projectId: path.projectId, name: payload.name })

    return { statusCode: HTTP_STATUS.ok, body: { project } }
  }
}
