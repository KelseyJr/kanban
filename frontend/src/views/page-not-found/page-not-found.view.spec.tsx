import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render-with-providers'
import { PageNotFoundView } from './page-not-found.view'

describe('PageNotFoundView', () => {
  it('says the page was not found and links back to the project list', async () => {
    await renderWithProviders({ ui: <PageNotFoundView /> })

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a lista de projetos' })).toHaveAttribute('href', '/')
  })
})
