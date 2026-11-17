import type { ReactElement, ReactNode } from 'react'

type IconFrameProps = {
  children: ReactNode
}

function IconFrame({ children }: IconFrameProps): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function PlusIcon(): ReactElement {
  return <IconFrame><path d="M8 3v10M3 8h10" /></IconFrame>
}

export function ChevronDownIcon(): ReactElement {
  return <IconFrame><path d="m4 6 4 4 4-4" /></IconFrame>
}

export function ArrowLeftIcon(): ReactElement {
  return <IconFrame><path d="M13 8H3m4-4L3 8l4 4" /></IconFrame>
}

export function GripIcon(): ReactElement {
  return (
    <IconFrame>
      <path d="M6 4h.01M10 4h.01M6 8h.01M10 8h.01M6 12h.01M10 12h.01" strokeWidth="2.5" />
    </IconFrame>
  )
}
