import { describe, expect, it, mock } from 'bun:test'
import type { Project } from '@/domain/project/project.entity'
import { buildProject } from '@/test/fixtures'
import { RequestValidationError } from '../request-validation'
import { RenameProjectController } from './rename-project.controller'

const PROJECT_ID = '0b9b3c0e-6f0f-4f8e-9a53-0d6f1b2c3d4e'

type BuildControllerResult = {
  renameProjectUseCase: { execute: ReturnType<typeof mock<() => Promise<{ project: Project }>>> }
  renameProjectController: RenameProjectController
}

function buildController(): BuildControllerResult {
  const renameProjectUseCase = { execute: mock(async () => ({ project: buildProject({ overrides: { name: 'kanban-app' } }) })) }

  return { renameProjectUseCase, renameProjectController: new RenameProjectController({ renameProjectUseCase }) }
}

describe('RenameProjectController', () => {
  it('answers 200 with the renamed project', async () => {
    const { renameProjectUseCase, renameProjectController } = buildController()

    const response = await renameProjectController.handle({ params: { projectId: PROJECT_ID }, body: { name: ' kanban-app ' } })

    expect(renameProjectUseCase.execute).toHaveBeenCalledWith({ projectId: PROJECT_ID, name: 'kanban-app' })
    expect(response.statusCode).toBe(200)
  })

  it('rejects a blank name without calling the use case', async () => {
    const { renameProjectUseCase, renameProjectController } = buildController()

    const handling = renameProjectController.handle({ params: { projectId: PROJECT_ID }, body: { name: ' ' } })

    await expect(handling).rejects.toBeInstanceOf(RequestValidationError)
    expect(renameProjectUseCase.execute).not.toHaveBeenCalled()
  })

  it('rejects a malformed project id', async () => {
    const { renameProjectController } = buildController()

    const handling = renameProjectController.handle({ params: { projectId: 'abc' }, body: { name: 'x' } })

    await expect(handling).rejects.toMatchObject({ target: 'params' })
  })
})
