import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { BoardView } from '@/views/board/board.view'
import { loadBoard } from '@/hooks/use-project/load-board'
import { ProjectNotFoundView } from '@/views/project-not-found/project-not-found.view'

export const Route = createFileRoute('/projects/$projectId')({
  loader: ({ context, params }) => loadBoard({ queryClient: context.queryClient, projectId: params.projectId }),
  component: BoardRoute,
  notFoundComponent: ProjectNotFoundView,
})

function BoardRoute(): ReactElement {
  const { projectId } = Route.useParams()

  return <BoardView projectId={projectId} />
}
