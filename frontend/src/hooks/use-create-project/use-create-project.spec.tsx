import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setupQueryHook } from '@/test/setup-query-hook'
import { buildProject } from '@/test/fixtures'
import { useCreateProject } from './use-create-project'

const project = buildProject()

describe('useCreateProject', () => {
  it('creates the project and invalidates the project list', async () => {
    const { wrapper, invalidateQueries } = setupQueryHook({
      routes: [{ method: 'POST', path: '/projects', respond: () => ({ status: 201, body: { project } }) }],
    })
    const { result } = renderHook(() => useCreateProject(), { wrapper })

    await act(() => result.current.createProject({ name: 'kanban' }))

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['projects'] }))
  })

  it('does not invalidate the list when the request fails', async () => {
    const conflict = { status: 409, body: { code: 'PROJECT_NAME_ALREADY_EXISTS', message: 'Já existe.' } }
    const { wrapper, invalidateQueries } = setupQueryHook({
      routes: [{ method: 'POST', path: '/projects', respond: () => conflict }],
    })
    const { result } = renderHook(() => useCreateProject(), { wrapper })

    const creation = act(() => result.current.createProject({ name: 'kanban' }))

    await expect(creation).rejects.toMatchObject({ status: 409 })
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
