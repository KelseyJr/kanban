# React Standards

Apply these standards to React code: views, components and hooks.

## 1. Components

- Each component has one responsibility and stays within 30 lines: past it, extract child components, or move logic into a hook.
- Name a component after its role in the UI: `OrderSummary`, `StatusBadge`, `LoadingIndicator`.
- Declare components with `function`, type their props as `<ComponentName>Props`, and annotate the return as `ReactElement`.
- Before writing a component, look for an existing one that does the job, and extend it instead of copying it.
- Render conditionally from a boolean: `{orders.length > 0 && <OrderList orders={orders} />}`. A bare number (`{orders.length && ...}`) renders `0`.
- Key list items by a stable id from the data: `key={order.id}`. Index keys mix up state when the list reorders.

```tsx
type StatusCardProps = {
  isOnline: boolean
}

export function StatusCard({ isOnline }: StatusCardProps): ReactElement {
  const label = isOnline ? 'API online' : 'API offline'
  const textColor = isOnline ? 'text-green-700' : 'text-red-700'

  return (
    <section aria-label="API status" className="rounded-lg border p-4">
      <p className={textColor}>{label}</p>
    </section>
  )
}
```

## 2. Props

Destructure each prop by name, so the component's API reads from its signature and only known attributes reach the DOM.

Instead of:

```tsx
function Button(props: ButtonProps): ReactElement {
  return <button {...props} />
}
```

Write:

```tsx
type ButtonProps = {
  label: string
  isDisabled?: boolean
  onClick: () => void
}

function Button({ label, isDisabled = false, onClick }: ButtonProps): ReactElement {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
    >
      {label}
    </button>
  )
}
```

Name callback props `on<Event>` (`onSelect`) and the functions passed to them `handle<Event>` (`handleSelect`).

## 3. State, effects and hooks

- Keep state minimal: compute during render anything derivable from props or existing state.
- `useEffect` syncs React with an external system: a subscription, a timer, a browser API, a non-React widget. Server data comes through custom hooks over TanStack Query (`useQuery`, `useMutation`), and work triggered by a user action runs in its event handler.
- A custom hook starts with `use`, takes one object parameter and returns an object: `const { data, isLoading } = useOrders({ status })`.

Instead of:

```tsx
const [fullName, setFullName] = useState('')

useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])
```

Write:

```tsx
const fullName = `${firstName} ${lastName}`
```

## 4. Memoization

With React Compiler enabled (`babel-plugin-react-compiler` in `vite.config.ts`), the compiler memoizes: write components without `useMemo`, `useCallback` or `memo`.

Without the compiler, use `useMemo` only for a computation that is measurably expensive, listing every value it reads as a dependency:

```tsx
const matchingUsers = useMemo(
  () => users.filter((user) => user.name.includes(searchTerm)),
  [users, searchTerm],
)
```

## 5. Accessibility

- Build with semantic elements (`button`, `a`, `nav`, `main`, `section`, `form`, `label`), and add `aria-*` attributes where the element alone doesn't convey name or state: `aria-expanded`, `aria-pressed`, `aria-current`, `aria-invalid`.
- Every interactive control has an accessible name: its visible text, a `<label htmlFor>` for inputs, or `aria-label` for icon-only buttons.
- Announce loading, success and error messages with `role="status"` or `role="alert"`.
- Images carry `alt` text; decorative ones get `alt=""`.

```tsx
function LoadingMessage(): ReactElement {
  return (
    <p role="status" aria-busy="true">
      Loading orders...
    </p>
  )
}

function CloseButton({ onClose }: CloseButtonProps): ReactElement {
  return (
    <button type="button" aria-label="Close dialog" onClick={onClose}>
      <XIcon aria-hidden="true" />
    </button>
  )
}
```

## 6. Styling

- Style with Tailwind CSS utility classes in the JSX. Keep `style` for values computed at runtime (a progress width), and stylesheets for what utilities can't express.
- Pick variant classes from a lookup map typed by the variant union, instead of a chain of ternaries.
- Cover hover, `focus-visible`, disabled and the responsive breakpoints the design needs.

```tsx
const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-slate-100 text-slate-800',
}

function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  return <span className={`rounded px-2 py-1 text-sm ${STATUS_BADGE_CLASSES[status]}`}>{status}</span>
}
```

---

Before finishing, check every component and hook you changed against each section above.
