export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet'

const BASE_CLASSES =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[3px] px-3.5 text-sm font-bold tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper hover:bg-steel',
  secondary: 'border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-paper',
  danger: 'bg-stamp text-paper hover:bg-[#a52520]',
  quiet: 'text-ink-soft underline decoration-1 hover:text-ink',
}

type GetButtonClassesParams = {
  variant: ButtonVariant
}

export function getButtonClasses({ variant }: GetButtonClassesParams): string {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`
}
