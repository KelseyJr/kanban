# Frontend Folder Structure

Apply this structure to React single-page apps built with Vite. Files a tool requires keep the name and place the tool expects (`index.html`, `main.tsx`, `vite.config.ts`).

Create only the files a feature needs.

## 1. Project layout

```
.
├── public/
│   └── favicon.svg
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── types/
│   │   └── user.ts
│   ├── services/
│   │   ├── api.client.ts
│   │   └── users/
│   │       ├── users.service.ts
│   │       └── users.service.spec.ts
│   ├── hooks/
│   │   └── use-users/
│   │       ├── use-users.ts
│   │       └── use-users.spec.ts
│   ├── components/
│   │   └── user-list/
│   │       ├── user-list.tsx
│   │       └── user-list.spec.tsx
│   ├── views/
│   │   └── users/
│   │       ├── users.view.tsx
│   │       ├── users.view.spec.tsx
│   │       └── components/
│   │           └── users-filter/
│   │               ├── users-filter.tsx
│   │               └── users-filter.spec.tsx
│   ├── assets/
│   │   └── logo.svg
│   ├── main.tsx
│   ├── app.tsx
│   ├── routes.tsx
│   └── index.css
├── e2e/
│   └── list-users.e2e-spec.ts
├── .env.example
├── index.html
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

- `main.tsx` mounts the app; `app.tsx` sets up the app-wide providers (router, query client); `routes.tsx` maps each path to its view; `index.css` holds the global styles.
- Config files stay at the project root, where their tools look for them.

## 2. Layers

Data flows from the screen to the backend and back:

```
view → hook → service → backend API
```

| Folder            | Holds                                                                                 | Imports from                                  |
| ----------------- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| `src/views/`      | One folder per screen: composes components and coordinates the screen through hooks   | `src/components/`, `src/hooks/`, `src/types/` |
| `src/components/` | One folder per reusable UI component                                                  | `src/components/`, `src/hooks/`, `src/types/` |
| `src/hooks/`      | One folder per hook: data loading, state and behaviour shared by views and components | `src/hooks/`, `src/services/`, `src/types/`   |
| `src/services/`   | Backend access: the shared HTTP client, and one folder per API resource               | `src/services/`, `src/types/`, `src/config/`  |
| `src/types/`      | Types shared across folders, one file per concept                                     | `src/types/`                                  |
| `src/assets/`     | Images, icons and fonts imported by the code                                          | —                                             |
| `src/config/`     | `env.ts`: reads `import.meta.env` and validates it at startup                         | —                                             |
| `public/`         | Static files served as they are, outside the bundler                                  | —                                             |

- Only `src/services/` talks to the backend, and only hooks call services. Views and components get their data through hooks.
- Views and components hold markup and wiring. Logic beyond rendering (data loading, derived state, form handling) goes into a hook. Business rules live in the backend.

Instead of:

`src/views/users/users.view.tsx`:

```tsx
export function UsersView(): ReactElement {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/users`)
      .then((response) => response.json())
      .then(setUsers)
  }, [])

  return <UserList users={users} />
}
```

Write (TanStack Query shown):

`src/services/users/users.service.ts`:

```ts
import { apiClient } from '@/services/api.client'
import type { User } from '@/types/user'

export type ListUsersResult = {
  users: User[]
}

export async function listUsers(): Promise<ListUsersResult> {
  const { data: users } = await apiClient.get<User[]>({ path: '/users' })

  return { users }
}
```

`src/hooks/use-users/use-users.ts`:

```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { listUsers, type ListUsersResult } from '@/services/users/users.service'

export function useUsers(): UseQueryResult<ListUsersResult> {
  return useQuery({ queryKey: ['users'], queryFn: listUsers })
}
```

`src/views/users/users.view.tsx`:

```tsx
import type { ReactElement } from 'react'
import { UserList } from '@/components/user-list/user-list'
import { useUsers } from '@/hooks/use-users/use-users'

export function UsersView(): ReactElement {
  const { data } = useUsers()

  return <UserList users={data?.users ?? []} />
}
```

## 3. Files and folders

Each view, component, hook and service gets its own folder, with the implementation and its spec side by side:

| Unit      | Folder                      | Implementation     | Spec                    |
| --------- | --------------------------- | ------------------ | ----------------------- |
| View      | `src/views/users/`          | `users.view.tsx`   | `users.view.spec.tsx`   |
| Component | `src/components/user-list/` | `user-list.tsx`    | `user-list.spec.tsx`    |
| Hook      | `src/hooks/use-users/`      | `use-users.ts`     | `use-users.spec.ts`     |
| Service   | `src/services/users/`       | `users.service.ts` | `users.service.spec.ts` |

- Components and hooks are named after their export in kebab-case: `UserList` → `user-list.tsx`, `useUsers` → `use-users.ts`.
- Views and services carry a role suffix. Views are named after the screen (`users.view.tsx` exports `UsersView`); services after the API resource they call (`users.service.ts`, `orders.service.ts`).
- A component used by a single view lives in that view's `components/` folder. It moves to `src/components/` once a second view uses it.
- The shared HTTP client (base URL, headers, error handling) is `src/services/api.client.ts`.
- Types used by one unit stay in its file. Types shared across folders go in `src/types/`, one file per concept: `user.ts` exports `User`.
- A helper lives in the folder of the unit that uses it. Create a new folder only for a responsibility that is clear and recurs across features.
- Types, assets and config have no behaviour, so they have no spec. `main.tsx`, `app.tsx` and `routes.tsx` are covered by the E2E specs.

## 4. E2E tests

E2E specs live in `e2e/` at the project root, outside `src/`. They use Playwright to run full user flows in the browser, one spec per flow, named after it: `e2e/list-users.e2e-spec.ts`, `e2e/checkout.e2e-spec.ts`.

Unit and E2E specs run apart, each with its own config and script, so neither suite picks up the other's files:

| Suite            | Config                          | Includes                 | Script             |
| ---------------- | ------------------------------- | ------------------------ | ------------------ |
| Unit (Vitest)    | `vite.config.ts` (`test` block) | `src/**/*.spec.{ts,tsx}` | `npm test`         |
| E2E (Playwright) | `playwright.config.ts`          | `e2e/**/*.e2e-spec.ts`   | `npm run test:e2e` |

## 5. Adding a feature

1. **Types**: the API shapes the feature needs, in `src/types/` when more than one folder uses them.
2. **Service**: the endpoint calls, in `src/services/<resource>/`.
3. **Hook**: `src/hooks/use-<name>/`, calling the service.
4. **Components**: in the view's `components/` folder, or in `src/components/` when another view already uses them.
5. **View**: `src/views/<screen>/`, with its path registered in `src/routes.tsx`.
6. **E2E**: `e2e/<flow>.e2e-spec.ts`.

---

Before finishing, check that every file you created sits where this rule places it, every implementation with behaviour has its sibling spec, every import follows the table in section 2, and every new user flow has an E2E spec.
