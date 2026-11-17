import type { ReactElement } from 'react'
import { useCards } from '@/hooks/use-cards/use-cards'
import { useProject } from '@/hooks/use-project/use-project'
import { AppHeader } from '@/components/app-header/app-header'
import { Board } from '@/views/board/components/board/board'
import { CreateCardButton } from '@/views/board/components/create-card-button/create-card-button'

type BoardPageProps = {
  projectId: string
}

export function BoardView({ projectId }: BoardPageProps): ReactElement {
  const { project } = useProject({ projectId })
  const { cards } = useCards({ projectId })

  return (
    <>
      <AppHeader title={project.name} actions={<CreateCardButton projectId={projectId} />} />
      <main className="px-4 py-6 sm:px-8">
        <h1 className="sr-only">Quadro do projeto {project.name}</h1>
        <Board projectId={projectId} cards={cards} />
      </main>
    </>
  )
}
