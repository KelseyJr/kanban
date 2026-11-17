import type { ReactElement } from 'react'
import { getButtonClasses } from '@/components/button-styles/button-styles'
import { PlusIcon } from '@/components/icons/icons'
import { TextField } from '@/components/text-field/text-field'
import { useCreateProject } from '@/hooks/use-create-project/use-create-project'
import { useProjectNameForm } from '@/hooks/use-project-name-form/use-project-name-form'

export function CreateProjectForm(): ReactElement {
  const { createProject, isPending } = useCreateProject()
  const { name, errorMessage, setName, handleSubmit } = useProjectNameForm({
    initialName: '',
    shouldResetAfterSave: true,
    saveName: createProject,
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Novo projeto"
      className="flex flex-col gap-3 border-t-4 border-ink bg-paper p-4 shadow-envelope sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <TextField label="Nome do projeto" value={name} errorMessage={errorMessage} onChange={setName} />
      </div>
      <button type="submit" disabled={isPending} className={`${getButtonClasses({ variant: 'primary' })} sm:mt-7`}>
        <PlusIcon />
        Criar projeto
      </button>
    </form>
  )
}
