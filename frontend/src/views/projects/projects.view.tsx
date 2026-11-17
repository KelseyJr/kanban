import type { ReactElement } from 'react'
import { AppHeader } from '@/components/app-header/app-header'
import { SlotLabel } from '@/components/slot-label/slot-label'
import { useProjects } from '@/hooks/use-projects/use-projects'
import type { Project } from '@/types/project'
import { CreateProjectForm } from '@/views/projects/components/create-project-form/create-project-form'
import { ProjectListItem } from '@/views/projects/components/project-list-item/project-list-item'

const PROJECTS_HEADING_ID = 'projects-heading'

export function ProjectsView(): ReactElement {
  const { projects } = useProjects()

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
        <section aria-labelledby={PROJECTS_HEADING_ID} className="rounded-[6px] bg-steel px-3 pb-3 shadow-slot sm:px-4 sm:pb-4">
          <SlotLabel id={PROJECTS_HEADING_ID} name="Projetos" count={projects.length} headingLevel="h1" />
          <CreateProjectForm />
          {projects.length > 0 ? <ProjectList projects={projects} /> : <EmptyProjects />}
        </section>
      </main>
    </>
  )
}

type ProjectListProps = {
  projects: Project[]
}

function ProjectList({ projects }: ProjectListProps): ReactElement {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {projects.map((project) => (
        <ProjectListItem key={project.id} project={project} />
      ))}
    </ul>
  )
}

function EmptyProjects(): ReactElement {
  return (
    <p className="mt-3 rounded-[4px] border-2 border-dashed border-steel-line px-4 py-8 text-center font-semibold text-steel-text">
      Ainda não há projetos. Crie o primeiro acima.
    </p>
  )
}
