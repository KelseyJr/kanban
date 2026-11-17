import type { ReactElement } from 'react'
import { getButtonClasses } from '@/components/button-styles/button-styles'
import { TextField } from '@/components/text-field/text-field'
import type { Project } from '@/types/project'
import { useProjectNameForm } from '@/hooks/use-project-name-form/use-project-name-form'
import { useRenameProject } from '@/hooks/use-rename-project/use-rename-project'

type RenameProjectFormProps = {
  project: Project
  onDone: () => void
}

export function RenameProjectForm({ project, onDone }: RenameProjectFormProps): ReactElement {
  const { renameProject, isPending } = useRenameProject()
  const { name, errorMessage, setName, handleSubmit } = useProjectNameForm({
    initialName: project.name,
    shouldResetAfterSave: false,
    saveName: ({ name: newName }): ReturnType<typeof renameProject> => renameProject({ projectId: project.id, name: newName }),
    onSaved: onDone,
  })

  return (
    <form noValidate onSubmit={handleSubmit} aria-label={`Renomear ${project.name}`} className="flex flex-col gap-3">
      <TextField label="Novo nome" value={name} errorMessage={errorMessage} onChange={setName} />
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className={getButtonClasses({ variant: 'primary' })}>
          Salvar
        </button>
        <button type="button" onClick={onDone} className={getButtonClasses({ variant: 'secondary' })}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
