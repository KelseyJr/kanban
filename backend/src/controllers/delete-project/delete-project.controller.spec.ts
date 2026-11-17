import { describe, expect, it, mock } from 'bun:test'
import { RequestValidationError } from '../request-validation'
import { DeleteProjectController } from './delete-project.controller'

const PROJECT_ID = '0b9b3c0e-6f0f-4f8e-9a53-0d6f1b2c3d4e'

describe('DeleteProjectController', () => {
  it('answers 204 with no body after deleting the project', async () => {
    const deleteProjectUseCase = { execute: mock(async () => undefined) }
    const deleteProjectController = new DeleteProjectController({ deleteProjectUseCase })

    const response = await deleteProjectController.handle({ params: { projectId: PROJECT_ID } })

    expect(deleteProjectUseCase.execute).toHaveBeenCalledWith({ projectId: PROJECT_ID })
    expect(response).toEqual({ statusCode: 204 })
  })

  it('rejects a malformed project id without calling the use case', async () => {
    const deleteProjectUseCase = { execute: mock(async () => undefined) }
    const deleteProjectController = new DeleteProjectController({ deleteProjectUseCase })

    const handling = deleteProjectController.handle({ params: { projectId: '123' } })

    await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
    expect(deleteProjectUseCase.execute).not.toHaveBeenCalled()
  })
})
