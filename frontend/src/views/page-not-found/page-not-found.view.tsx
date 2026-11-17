import { Link } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { AppHeader } from '@/components/app-header/app-header'
import { ArrowLeftIcon } from '@/components/icons/icons'

export function PageNotFoundView(): ReactElement {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Página não encontrada</h1>
        <p className="mt-2 text-ink-soft">O endereço não corresponde a nenhuma página do Kanban.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 font-bold text-ink underline">
          <ArrowLeftIcon />
          Voltar para a lista de projetos
        </Link>
      </main>
    </>
  )
}
