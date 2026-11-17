import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubApi } from '@/test/fetch-stub'
import { buildProject } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render-with-providers'
import { CreateProjectForm } from './create-project-form'

const CONFLICT = { status: 409, body: { code: 'PROJECT_NAME_ALREADY_EXISTS', message: 'Já existe um projeto com esse nome.' } }

describe('CreateProjectForm', () => {
  it('creates the project with the name trimmed and clears the field', async () => {
    const { fetchMock } = stubApi({
      routes: [{ method: 'POST', path: '/projects', respond: () => ({ status: 201, body: { project: buildProject() } }) }],
    })
    const { user } = await renderWithProviders({ ui: <CreateProjectForm /> })

    await user.type(screen.getByRole('textbox', { name: 'Nome do projeto' }), '  kanban  ')
    await user.click(screen.getByRole('button', { name: 'Criar projeto' }))

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/projects', expect.objectContaining({ body: JSON.stringify({ name: 'kanban' }) }))
    expect(screen.getByRole('textbox', { name: 'Nome do projeto' })).toHaveValue('')
  })

  it.each([
    ['blank', '   ', 'Informe o nome do projeto.'],
    ['81 characters long', 'a'.repeat(81), 'O nome do projeto deve ter no máximo 80 caracteres.'],
  ])('rejects a %s name without calling the API', async (_, name, message) => {
    const { fetchMock } = stubApi({ routes: [] })
    const { user } = await renderWithProviders({ ui: <CreateProjectForm /> })

    if (name.trim()) await user.type(screen.getByRole('textbox', { name: 'Nome do projeto' }), name)
    await user.click(screen.getByRole('button', { name: 'Criar projeto' }))

    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('textbox', { name: 'Nome do projeto' })).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the server message when the name is already used', async () => {
    stubApi({ routes: [{ method: 'POST', path: '/projects', respond: () => CONFLICT }] })
    const { user } = await renderWithProviders({ ui: <CreateProjectForm /> })

    await user.type(screen.getByRole('textbox', { name: 'Nome do projeto' }), 'kanban')
    await user.click(screen.getByRole('button', { name: 'Criar projeto' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um projeto com esse nome.')
    expect(screen.getByRole('textbox', { name: 'Nome do projeto' })).toHaveValue('kanban')
  })
})
