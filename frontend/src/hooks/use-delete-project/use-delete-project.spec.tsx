import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setupQueryHook } from '@/test/setup-query-hook'
import { useDeleteProject } from './use-delete-project'

describe('useDeleteProject', () => {
  it('deletes the project and invalidates the project list', async () => {
    const { wrapper, invalidateQueries } = setupQueryHook({
      routes: [{ method: 'DELETE', path: '/projects/project-1', respond: () => ({ status: 204 }) }],
    })
    const { result } = renderHook(() => useDeleteProject(), { wrapper })

    const outcome = await act(() => result.current.deleteProject({ projectId: 'project-1' }))

    expect(outcome).toEqual({})
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['projects'] }))
  })

  it('returns the error message instead of throwing when the request fails', async () => {
    const failure = { status: 404, body: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } }
    const { wrapper } = setupQueryHook({
      routes: [{ method: 'DELETE', path: '/projects/project-1', respond: () => failure }],
    })
    const { result } = renderHook(() => useDeleteProject(), { wrapper })

    const outcome = await act(() => result.current.deleteProject({ projectId: 'project-1' }))

    expect(outcome).toEqual({ errorMessage: 'Projeto não encontrado.' })
  })
})
