import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubApi } from '@/test/fetch-stub'
import { buildProject } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render-with-providers'
import { ProjectListItem } from './project-list-item'

const site = buildProject({ id: 'p-site', name: 'site' })
const ITEM = (
  <ul>
    <ProjectListItem project={site} />
  </ul>
)

describe('ProjectListItem', () => {
  it('renames the project and returns to the link', async () => {
    const { fetchMock } = stubApi({
      routes: [{ method: 'PATCH', path: '/projects/p-site', respond: () => ({ body: { project: { ...site, name: 'site-novo' } } }) }],
    })
    const { user } = await renderWithProviders({ ui: ITEM })

    await user.click(screen.getByRole('button', { name: 'Renomear site' }))
    await user.clear(screen.getByRole('textbox', { name: 'Novo nome' }))
    await user.type(screen.getByRole('textbox', { name: 'Novo nome' }), 'site-novo')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/projects/p-site', expect.objectContaining({ body: JSON.stringify({ name: 'site-novo' }) }))
    expect(await screen.findByRole('link', { name: 'site' })).toBeInTheDocument()
  })

  it('rejects a blank new name and keeps the form open', async () => {
    const { fetchMock } = stubApi({ routes: [] })
    const { user } = await renderWithProviders({ ui: ITEM })

    await user.click(screen.getByRole('button', { name: 'Renomear site' }))
    await user.clear(screen.getByRole('textbox', { name: 'Novo nome' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome do projeto.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('cancels the rename without calling the API', async () => {
    const { fetchMock } = stubApi({ routes: [] })
    const { user } = await renderWithProviders({ ui: ITEM })

    await user.click(screen.getByRole('button', { name: 'Renomear site' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('link', { name: 'site' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('deletes the project only after confirmation', async () => {
    const { fetchMock } = stubApi({ routes: [{ method: 'DELETE', path: '/projects/p-site', respond: () => ({ status: 204 }) }] })
    const { user } = await renderWithProviders({ ui: ITEM })

    await user.click(screen.getByRole('button', { name: 'Excluir site' }))
    expect(screen.getByRole('dialog', { name: 'Excluir projeto' })).toHaveTextContent('todos os seus cards serão excluídos')
    await user.click(screen.getByRole('button', { name: 'Excluir projeto' }))

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/projects/p-site', expect.objectContaining({ method: 'DELETE' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the project when the deletion is cancelled', async () => {
    const { fetchMock } = stubApi({ routes: [] })
    const { user } = await renderWithProviders({ ui: ITEM })

    await user.click(screen.getByRole('button', { name: 'Excluir site' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the error when the deletion fails', async () => {
    stubApi({
      routes: [{ method: 'DELETE', path: '/projects/p-site', respond: () => ({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } }) }],
    })
    const { user } = await renderWithProviders({ ui: ITEM })

    await user.click(screen.getByRole('button', { name: 'Excluir site' }))
    await user.click(screen.getByRole('button', { name: 'Excluir projeto' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno do servidor.')
  })
})
