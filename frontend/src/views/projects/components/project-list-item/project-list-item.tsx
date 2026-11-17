import { Link } from '@tanstack/react-router'
import { type ReactElement, useState } from 'react'
import { getButtonClasses } from '@/components/button-styles/button-styles'
import type { Project } from '@/types/project'
import { DeleteProjectDialog } from '@/views/projects/components/delete-project-dialog/delete-project-dialog'
import { RenameProjectForm } from '@/views/projects/components/rename-project-form/rename-project-form'

const PROJECT_ITEM_MODE = { reading: 'reading', renaming: 'renaming', deleting: 'deleting' } as const

type ProjectItemMode = (typeof PROJECT_ITEM_MODE)[keyof typeof PROJECT_ITEM_MODE]

type ProjectListItemProps = {
  project: Project
}

export function ProjectListItem({ project }: ProjectListItemProps): ReactElement {
  const [mode, setMode] = useState<ProjectItemMode>(PROJECT_ITEM_MODE.reading)
  const returnToReading = (): void => setMode(PROJECT_ITEM_MODE.reading)

  return (
    <li className="border-t-4 border-ink bg-paper px-4 py-3 shadow-envelope">
      {mode === PROJECT_ITEM_MODE.renaming ? (
        <RenameProjectForm project={project} onDone={returnToReading} />
      ) : (
        <ProjectSummary project={project} onRename={() => setMode(PROJECT_ITEM_MODE.renaming)} onDelete={() => setMode(PROJECT_ITEM_MODE.deleting)} />
      )}
      {mode === PROJECT_ITEM_MODE.deleting && <DeleteProjectDialog project={project} onClose={returnToReading} />}
    </li>
  )
}

type ProjectSummaryProps = {
  project: Project
  onRename: () => void
  onDelete: () => void
}

function ProjectSummary({ project, onRename, onDelete }: ProjectSummaryProps): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to="/projects/$projectId"
        params={{ projectId: project.id }}
        className="min-w-0 flex-1 truncate text-[17px] font-bold text-ink decoration-2 hover:underline"
      >
        {project.name}
      </Link>
      <button type="button" aria-label={`Renomear ${project.name}`} onClick={onRename} className={getButtonClasses({ variant: 'secondary' })}>
        Renomear
      </button>
      <button type="button" aria-label={`Excluir ${project.name}`} onClick={onDelete} className={getButtonClasses({ variant: 'quiet' })}>
        Excluir
      </button>
    </div>
  )
}
