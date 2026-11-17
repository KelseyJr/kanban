import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setupQueryHook } from '@/test/setup-query-hook'
import { buildProject } from '@/test/fixtures'
import { useRenameProject } from './use-rename-project'

const project = buildProject()

describe('useRenameProject', () => {
  it('renames the project and invalidates the project list', async () => {
    const { wrapper, invalidateQueries } = setupQueryHook({
      routes: [{ method: 'PATCH', path: '/projects/project-1', respond: () => ({ body: { project } }) }],
    })
    const { result } = renderHook(() => useRenameProject(), { wrapper })

    await act(() => result.current.renameProject({ projectId: 'project-1', name: 'kanban' }))

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['projects'] }))
  })
})
