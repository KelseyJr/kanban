---
paths:
  - "**/*.{ts,tsx,js,jsx}"
---

# JavaScript & TypeScript Standards

Apply these standards to `.ts`, `.tsx`, `.js` and `.jsx` files. Sections marked _(TypeScript)_ apply to TypeScript files only.

## 1. Size limits

- **Functions**: 30 lines at most.
- **Classes and files**: around 200 lines.

Past the limit, split by single responsibility.

## 2. Naming

| Element                                           | Convention       | Example                                         |
| ------------------------------------------------- | ---------------- | ----------------------------------------------- |
| Variables, local constants, functions, parameters | camelCase        | `totalPrice`, `retryCount`, `calculateTotal`    |
| Global constants                                  | UPPER_SNAKE_CASE | `MAX_RETRIES`, `CPF_PATTERN`, `STATUS_LABELS`   |
| Classes, types, interfaces, React components      | PascalCase       | `OrderService`, `CreateUserParams`, `UserCard`  |
| Files and folders                                 | kebab-case       | `order-service.ts`, `user-card.tsx`, `payment-gateway/` |

- A global constant is a module-level value fixed in the source: a number, string, regex, lookup map or `as const` object. Module-level values built by a call (`env`, `envSchema`, an API client) stay camelCase.
- Files whose name a framework or tool requires keep that name: `README.md`, `package.json`, `page.tsx`.

## 3. Declarations and modules

- Declare with `const` by default, and with `let` only when the variable is reassigned. `var` is never used.
- Use ES modules (`import`/`export`); keep `require` only in projects that are CommonJS.
- Export only what is part of the module's contract; helpers stay private to the file.

## 4. Functions

### Object in, object out

Functions take a single object parameter and return an object. Adding a field later breaks no caller, call sites read by name, and the caller destructures only what it needs. Name the types `<FunctionName>Params` and `<FunctionName>Result`, and annotate the return type of every named function; async functions return `Promise<T>`.

Instead of:

```ts
function createUser(name: string, email: string, isAdmin: boolean): User

createUser('Ana', 'ana@email.com', true)
```

Write:

```ts
type CreateUserParams = {
  name: string
  email: string
  isAdmin: boolean
}

type CreateUserResult = {
  user: User
}

async function createUser({ name, email, isAdmin }: CreateUserParams): Promise<CreateUserResult> {
  const user = await db.user.create({ data: { name, email, isAdmin } })

  return { user }
}

const { user } = await createUser({ name: 'Ana', email: 'ana@email.com', isAdmin: true })
```

Exceptions:

- Inline callbacks (`map`, `filter`, `sort`, `reduce`) and signatures dictated by a framework or library (route handlers, event listeners, `setTimeout`).
- Predicates (`isValidEmail`, `hasAccess`) take an object but return a plain `boolean`.
- Type guards (`value is T`) take the value directly, since TypeScript narrows only a named parameter.

### Declarations and arrow functions

Declare named module-level functions, services and handlers with `function`, so they show up by name in stack traces. Use arrow functions for callbacks. Flatten nested callbacks with `async/await` or extracted named functions.

```ts
function listActiveUserNames({ users }: ListActiveUserNamesParams): ListActiveUserNamesResult {
  const names = users.filter((user) => user.isActive).map((user) => user.name)

  return { names }
}
```

## 5. Immutability and collections

Treat parameters, state and shared collections as read-only: return new objects and arrays instead of mutating them.

- Use `map` to transform, `filter` to select, `find` to fetch one item, `some`/`every` to test, and `reduce` only when the operation is truly an accumulation.
- `sort`, `reverse` and `splice` mutate in place: use `toSorted`, `toReversed` and `toSpliced`, or copy first with spread.

Instead of:

```ts
function addTag({ tags, tag }: AddTagParams): AddTagResult {
  tags.push(tag)
  return { tags }
}

users.sort((first, second) => first.name.localeCompare(second.name))
```

Write:

```ts
function addTag({ tags, tag }: AddTagParams): AddTagResult {
  return { tags: [...tags, tag] }
}

function activateUser({ user }: ActivateUserParams): ActivateUserResult {
  return { user: { ...user, isActive: true } }
}

const sortedUsers = users.toSorted((first, second) => first.name.localeCompare(second.name))
```

## 6. Conditionals and comparisons

- Compare with `===` and `!==`.
- Default with `??`, which falls back only on `null` and `undefined`, so valid `0`, `''` and `false` survive: `const limit = pageSize ?? DEFAULT_PAGE_SIZE`. Use `||` only when those falsy values are invalid too.
- Use a ternary only to pick between two values in one short decision. For nested decisions or side effects, write `if` statements or a guard clause.
- Type lookup maps as `Record<Union, Value>`, so the compiler flags a missing case. _(TypeScript)_

Instead of:

```ts
const label = isAdmin ? (isActive ? 'Active admin' : 'Inactive admin') : 'User'
isReady ? startProcess() : stopProcess()
```

Write:

```ts
const label = isAdmin ? 'Admin' : 'User'

if (isReady) {
  startProcess()
} else {
  stopProcess()
}
```

## 7. Constant groups

Group related values in an `as const` object and derive the union type from it.

```ts
const ORDER_STATUS = {
  pending: 'pending',
  shipped: 'shipped',
  delivered: 'delivered',
} as const

type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

if (order.status === ORDER_STATUS.shipped) await notifyCustomer({ order })
```

## 8. Type safety _(TypeScript)_

- Enable `strict` in `tsconfig.json`.
- Type everything precisely, with zero `any`. For data of unknown shape (API responses, `JSON.parse`, caught errors), use `unknown` and narrow it with a type guard or a schema.
- Validate external input (request bodies, third-party responses, env) at the boundary; inside it, trust the types.
- Fix the type rather than silencing the compiler with `as` casts or `!` assertions.
- Name object types after the domain (`Product`, `CreateProductParams`) instead of repeating anonymous inline object types.

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const body: unknown = await response.json()
if (!isRecord(body) || typeof body.message !== 'string') throw new Error('Unexpected response shape')
```

For anything beyond a simple shape check, parse with a schema (zod or the project's validation library).

## 9. Error handling

Treat caught errors as `unknown` (`catch (error: unknown)`) and narrow with `instanceof Error` before reading `.message`. When rethrowing, pass the original as `{ cause: error }`.

```ts
try {
  await refreshCache({ key })
} catch (error: unknown) {
  const reason = error instanceof Error ? error.message : String(error)
  logger.warn(`Cache refresh failed for ${key}, serving stale data: ${reason}`)
}
```

## 10. Environment config

Read the environment in one validated module, `src/config/env.ts` (zod shown; use the project's validation library):

```ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3000),
})

export const env = envSchema.parse(process.env)
```

```ts
import { env } from '@/config/env'

const stripe = new Stripe(env.STRIPE_SECRET_KEY)
```

## 11. Validation

After changing JS/TS code, run the affected app's checks: lint, typecheck and the tests covering the change. Take the commands from the `package.json` scripts (`npm run lint`, `npm run typecheck`, `npm test`), falling back to `npx tsc --noEmit` when no typecheck script exists. Fix every error the change introduced.

The task is done when those checks pass and every function and file you changed meets each section above. If a check is missing, or fails for reasons outside the change, say so in your final message.
