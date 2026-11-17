import { describe, expect, it, mock } from 'bun:test'
import type { Project } from '@/domain/project/project.entity'
import { buildProject } from '@/test/fixtures'
import { RequestValidationError } from '../request-validation'
import { CreateProjectController } from './create-project.controller'

const MAX_NAME_LENGTH = 80

type BuildControllerResult = {
  createProjectUseCase: { execute: ReturnType<typeof mock<() => Promise<{ project: Project }>>> }
  createProjectController: CreateProjectController
}

function buildController(): BuildControllerResult {
  const createProjectUseCase = { execute: mock(async () => ({ project: buildProject() })) }

  return { createProjectUseCase, createProjectController: new CreateProjectController({ createProjectUseCase }) }
}

describe('CreateProjectController', () => {
  it('answers 201 and trims the name before calling the use case', async () => {
    const { createProjectUseCase, createProjectController } = buildController()

    const response = await createProjectController.handle({ body: { name: '  kanban  ' } })

    expect(createProjectUseCase.execute).toHaveBeenCalledWith({ name: 'kanban' })
    expect(response).toEqual({ statusCode: 201, body: { project: buildProject() } })
  })

  it('accepts a name of exactly the maximum length', async () => {
    const { createProjectController } = buildController()

    const response = await createProjectController.handle({ body: { name: 'a'.repeat(MAX_NAME_LENGTH) } })

    expect(response.statusCode).toBe(201)
  })

  it.each([[{ name: '' }], [{ name: '   ' }], [{ name: 'a'.repeat(MAX_NAME_LENGTH + 1) }], [{}], [undefined]])(
    'rejects the body %p without calling the use case',
    async (body) => {
      const { createProjectUseCase, createProjectController } = buildController()

      const handling = createProjectController.handle({ body })

      await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
      expect(createProjectUseCase.execute).not.toHaveBeenCalled()
    },
  )
})
