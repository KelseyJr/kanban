import { type ChangeEvent, type ReactElement, useId } from 'react'

type TextFieldProps = {
  label: string
  value: string
  errorMessage?: string
  isMultiline?: boolean
  onChange: (value: string) => void
}

const FIELD_CLASSES =
  'w-full rounded-[3px] border-2 border-ink/40 bg-paper px-3 py-2 text-[15px] text-ink placeholder:text-ink-faint focus:border-ink aria-invalid:border-stamp'

export function TextField({ label, value, errorMessage, isMultiline = false, onChange }: TextFieldProps): ReactElement {
  const fieldId = useId()
  const errorId = `${fieldId}-error`

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    onChange(event.target.value)
  }

  const fieldProps = {
    id: fieldId,
    value,
    onChange: handleChange,
    className: FIELD_CLASSES,
    'aria-invalid': errorMessage ? true : undefined,
    'aria-describedby': errorMessage ? errorId : undefined,
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-bold">
        {label}
      </label>
      {isMultiline ? <textarea rows={5} {...fieldProps} /> : <input type="text" {...fieldProps} />}
      {errorMessage && <FieldError id={errorId} message={errorMessage} />}
    </div>
  )
}

type FieldErrorProps = {
  id: string
  message: string
}

function FieldError({ id, message }: FieldErrorProps): ReactElement {
  return (
    <p id={id} role="alert" className="text-sm font-semibold text-stamp">
      {message}
    </p>
  )
}
