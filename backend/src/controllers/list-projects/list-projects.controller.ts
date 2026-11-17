import { HTTP_STATUS, type HttpResponse } from '../http-response'
import type { ListProjectsUseCase } from '@/use-cases/list-projects/list-projects.use-case'

type ListProjectsControllerDependencies = {
  listProjectsUseCase: Pick<ListProjectsUseCase, 'execute'>
}

export class ListProjectsController {
  private readonly listProjectsUseCase: Pick<ListProjectsUseCase, 'execute'>

  constructor({ listProjectsUseCase }: ListProjectsControllerDependencies) {
    this.listProjectsUseCase = listProjectsUseCase
  }

  async handle(): Promise<HttpResponse> {
    const { projects } = await this.listProjectsUseCase.execute()

    return { statusCode: HTTP_STATUS.ok, body: { projects } }
  }
}
