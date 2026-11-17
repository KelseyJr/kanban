import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render-with-providers'
import { ProjectNotFoundView } from './project-not-found.view'

describe('ProjectNotFoundView', () => {
  it('says the project was not found and links back to the project list', async () => {
    await renderWithProviders({ ui: <ProjectNotFoundView /> })

    expect(screen.getByRole('heading', { name: 'Projeto não encontrado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a lista de projetos' })).toHaveAttribute('href', '/')
  })
})
