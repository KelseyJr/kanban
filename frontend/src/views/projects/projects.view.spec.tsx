import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { type FetchRoute, stubApi } from '@/test/fetch-stub'
import { buildProject } from '@/test/fixtures'
import { createTestQueryClient, renderWithProviders } from '@/test/render-with-providers'
import type { Project } from '@/types/project'
import { ProjectsView } from './projects.view'
import { PROJECTS_QUERY_KEY } from '@/hooks/use-projects/projects-queries'

type RenderProjectsPageParams = {
  projects: Project[]
  routes?: FetchRoute[]
}

async function renderProjectsPage({ projects, routes = [] }: RenderProjectsPageParams): ReturnType<typeof renderWithProviders> {
  stubApi({ routes: [...routes, { method: 'GET', path: '/projects', respond: () => ({ body: { projects } }) }] })
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(PROJECTS_QUERY_KEY, projects)

  return renderWithProviders({ ui: <ProjectsView />, queryClient })
}

const api = buildProject({ id: 'p-api', name: 'Api' })
const kanban = buildProject({ id: 'p-kanban', name: 'kanban' })
const site = buildProject({ id: 'p-site', name: 'site' })

describe('ProjectsView', () => {
  it('lists the projects in the order the API returns, each linking to its board', async () => {
    await renderProjectsPage({ projects: [api, kanban, site] })

    const links = within(screen.getByRole('list')).getAllByRole('link')

    expect(links.map((link) => link.textContent)).toEqual(['Api', 'kanban', 'site'])
    expect(links[1]).toHaveAttribute('href', '/projects/p-kanban')
  })

  it('shows the empty message and the create form when there are no projects', async () => {
    await renderProjectsPage({ projects: [] })

    expect(screen.getByText('Ainda não há projetos. Crie o primeiro acima.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Nome do projeto' })).toBeInTheDocument()
  })

  it('shows the project count on the label', async () => {
    await renderProjectsPage({ projects: [api, kanban] })

    expect(screen.getByText('Quantidade:').parentElement).toHaveTextContent('2')
  })
})
