import { createFileRoute } from '@tanstack/react-router'
import { ProjectsView } from '@/views/projects/projects.view'
import { projectsQueryOptions } from '@/hooks/use-projects/projects-queries'

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQueryOptions()),
  component: ProjectsView,
})
