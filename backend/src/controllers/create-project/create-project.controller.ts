import { z } from 'zod'
import type { CreateProjectUseCase } from '@/use-cases/create-project/create-project.use-case'
import { HTTP_STATUS, type HttpResponse } from '../http-response'
import { projectNameSchema } from '../request-schemas'
import { validateRequest } from '../request-validation'

const bodySchema = z.object({ name: projectNameSchema })

type CreateProjectControllerDependencies = {
  createProjectUseCase: Pick<CreateProjectUseCase, 'execute'>
}

type HandleParams = {
  body: unknown
}

export class CreateProjectController {
  private readonly createProjectUseCase: Pick<CreateProjectUseCase, 'execute'>

  constructor({ createProjectUseCase }: CreateProjectControllerDependencies) {
    this.createProjectUseCase = createProjectUseCase
  }

  async handle({ body }: HandleParams): Promise<HttpResponse> {
    const { value } = validateRequest({ schema: bodySchema, data: body, target: 'body' })
    const { project } = await this.createProjectUseCase.execute({ name: value.name })

    return { statusCode: HTTP_STATUS.created, body: { project } }
  }
}
