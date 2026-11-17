import { type AnyElysia, Elysia } from 'elysia'
import { CreateProjectController } from '@/controllers/create-project/create-project.controller'
import { DeleteProjectController } from '@/controllers/delete-project/delete-project.controller'
import { GetProjectController } from '@/controllers/get-project/get-project.controller'
import { ListProjectsController } from '@/controllers/list-projects/list-projects.controller'
import { RenameProjectController } from '@/controllers/rename-project/rename-project.controller'
import { DrizzleProjectsRepository } from '@/providers/drizzle/projects/projects.repository'
import type { Database } from '@/providers/drizzle/drizzle.client'
import { CreateProjectUseCase } from '@/use-cases/create-project/create-project.use-case'
import { DeleteProjectUseCase } from '@/use-cases/delete-project/delete-project.use-case'
import { GetProjectUseCase } from '@/use-cases/get-project/get-project.use-case'
import { ListProjectsUseCase } from '@/use-cases/list-projects/list-projects.use-case'
import { RenameProjectUseCase } from '@/use-cases/rename-project/rename-project.use-case'
import { reply } from './reply'

type CreateProjectsRoutesParams = {
  database: Database
}

type ProjectsControllers = {
  listProjectsController: ListProjectsController
  getProjectController: GetProjectController
  createProjectController: CreateProjectController
  renameProjectController: RenameProjectController
  deleteProjectController: DeleteProjectController
}

function buildProjectsControllers({ database }: CreateProjectsRoutesParams): ProjectsControllers {
  const projectsRepository = new DrizzleProjectsRepository({ database })

  return {
    listProjectsController: new ListProjectsController({ listProjectsUseCase: new ListProjectsUseCase({ projectsRepository }) }),
    getProjectController: new GetProjectController({ getProjectUseCase: new GetProjectUseCase({ projectsRepository }) }),
    createProjectController: new CreateProjectController({ createProjectUseCase: new CreateProjectUseCase({ projectsRepository }) }),
    renameProjectController: new RenameProjectController({ renameProjectUseCase: new RenameProjectUseCase({ projectsRepository }) }),
    deleteProjectController: new DeleteProjectController({ deleteProjectUseCase: new DeleteProjectUseCase({ projectsRepository }) }),
  }
}

export function createProjectsRoutes({ database }: CreateProjectsRoutesParams): AnyElysia {
  const controllers = buildProjectsControllers({ database })

  return new Elysia({ prefix: '/projects' })
    .get('/', async ({ set }) => reply({ set, response: await controllers.listProjectsController.handle() }))
    .post('/', async ({ set, body }) => reply({ set, response: await controllers.createProjectController.handle({ body }) }))
    .get('/:projectId', async ({ set, params }) => reply({ set, response: await controllers.getProjectController.handle({ params }) }))
    .patch('/:projectId', async ({ set, params, body }) =>
      reply({ set, response: await controllers.renameProjectController.handle({ params, body }) }),
    )
    .delete('/:projectId', async ({ set, params }) =>
      reply({ set, response: await controllers.deleteProjectController.handle({ params }) }),
    )
}
