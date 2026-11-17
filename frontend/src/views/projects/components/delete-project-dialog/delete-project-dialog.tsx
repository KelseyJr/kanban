import { type ReactElement, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog/confirm-dialog'
import type { Project } from '@/types/project'
import { useDeleteProject } from '@/hooks/use-delete-project/use-delete-project'

type DeleteProjectDialogProps = {
  project: Project
  onClose: () => void
}

export function DeleteProjectDialog({ project, onClose }: DeleteProjectDialogProps): ReactElement {
  const { deleteProject, isPending } = useDeleteProject()
  const [errorMessage, setErrorMessage] = useState<string>()

  async function handleConfirm(): Promise<void> {
    const result = await deleteProject({ projectId: project.id })
    setErrorMessage(result.errorMessage)
    if (!result.errorMessage) onClose()
  }

  return (
    <ConfirmDialog
      title="Excluir projeto"
      message={`O projeto “${project.name}” e todos os seus cards serão excluídos. Isso não pode ser desfeito.`}
      confirmLabel="Excluir projeto"
      isPending={isPending}
      errorMessage={errorMessage}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  )
}
