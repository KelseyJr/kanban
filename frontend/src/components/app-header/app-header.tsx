import { Link } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'

type AppHeaderProps = {
  title?: string
  actions?: ReactNode
}

export function AppHeader({ title, actions }: AppHeaderProps): ReactElement {
  return (
    <header className="flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 border-b-[3px] border-ink bg-postal px-4 py-3 sm:px-8">
      <Link to="/" className="text-xl font-extrabold tracking-wide text-ink no-underline">
        Kanban
      </Link>
      <nav aria-label="Navegação" className="flex min-w-0 items-center gap-2 text-[15px] font-semibold">
        <Link to="/" className="text-ink/75 no-underline hover:text-ink hover:underline">
          Projetos
        </Link>
        {title && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="truncate">
              {title}
            </span>
          </>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  )
}
