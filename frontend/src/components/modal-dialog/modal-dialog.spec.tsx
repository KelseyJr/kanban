import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModalDialog } from './modal-dialog'

describe('ModalDialog', () => {
  it('opens as a modal named by its title', () => {
    render(<ModalDialog title="Editar card" onClose={vi.fn()}>conteúdo</ModalDialog>)

    expect(screen.getByRole('dialog', { name: 'Editar card' })).toHaveAttribute('open')
  })

  it('calls onClose instead of closing by itself when Escape cancels it', () => {
    const onClose = vi.fn()
    render(<ModalDialog title="Editar card" onClose={onClose}>conteúdo</ModalDialog>)

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
  })
})
