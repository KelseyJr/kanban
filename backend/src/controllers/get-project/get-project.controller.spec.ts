import { describe, expect, it, mock } from 'bun:test'
import { buildProject } from '@/test/fixtures'
import { RequestValidationError } from '../request-validation'
import { GetProjectController } from './get-project.controller'

const PROJECT_ID = '0b9b3c0e-6f0f-4f8e-9a53-0d6f1b2c3d4e'

describe('GetProjectController', () => {
  it('answers 200 with the project', async () => {
    const project = buildProject({ overrides: { id: PROJECT_ID } })
    const getProjectUseCase = { execute: mock(async () => ({ project })) }
    const getProjectController = new GetProjectController({ getProjectUseCase })

    const response = await getProjectController.handle({ params: { projectId: PROJECT_ID } })

    expect(getProjectUseCase.execute).toHaveBeenCalledWith({ projectId: PROJECT_ID })
    expect(response).toEqual({ statusCode: 200, body: { project } })
  })

  it('rejects a malformed project id without calling the use case', async () => {
    const getProjectUseCase = { execute: mock(async () => ({ project: buildProject() })) }
    const getProjectController = new GetProjectController({ getProjectUseCase })

    const handling = getProjectController.handle({ params: { projectId: 'not-a-uuid' } })

    await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
    expect(getProjectUseCase.execute).not.toHaveBeenCalled()
  })
})
