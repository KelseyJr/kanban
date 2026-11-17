# Backend Folder Structure

Apply this structure to backend projects (HTTP APIs). Examples use TypeScript; in a JavaScript project the same names end in `.js`.

The structure is a light take on DDD: the domain sits at the center and the other layers depend on it. Create only the files a feature needs.

## 1. Project layout

```
.
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── domain/
│   │   └── user/
│   │       ├── user.entity.ts
│   │       ├── user.errors.ts
│   │       └── users.repository.ts
│   ├── use-cases/
│   │   └── create-user/
│   │       ├── create-user.use-case.ts
│   │       └── create-user.use-case.spec.ts
│   ├── providers/
│   │   └── prisma/
│   │       ├── prisma.client.ts
│   │       └── users/
│   │           ├── users.repository.ts
│   │           └── users.repository.spec.ts
│   ├── controllers/
│   │   └── create-user/
│   │       ├── create-user.controller.ts
│   │       └── create-user.controller.spec.ts
│   └── main/
│       ├── server.ts
│       ├── routes.ts
│       └── error-handler.ts
├── e2e/
│   └── create-user.e2e-spec.ts
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── vitest.e2e.config.ts
```

Config files and tool-owned folders stay at the project root, where their tools look for them: `prisma/` holds the schema and migrations, while the client that uses them lives in `src/providers/prisma/`.

## 2. Layers

A request flows inward and back:

```
HTTP request → controller → use case → repository interface → provider → database
```

| Folder             | Holds                                                                                      | Imports from                                   |
| ------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `src/domain/`      | One folder per entity: the entity, its errors and its repository interface                 | `src/domain/`                                  |
| `src/use-cases/`   | One folder per application action: the business flow                                       | `src/domain/`                                  |
| `src/providers/`   | One folder per technology: its client and the implementations of domain interfaces         | `src/domain/`, `src/providers/`, `src/config/` |
| `src/controllers/` | One folder per HTTP action: validates the request, calls the use case, shapes the response | `src/use-cases/`, `src/domain/`                |
| `src/main/`        | Server startup, routes, error handler and middlewares                                      | every folder                                   |
| `src/config/`      | `env.ts`: reads the environment and validates it at startup                                | —                                              |

- Business rules live in use cases and entities. Controllers translate between HTTP and use cases; providers translate between use cases and the database or external APIs.
- Database access and external APIs (I/O) reach use cases through an interface declared in the domain and implemented in `src/providers/`. Pure libraries (bcrypt, zod, date-fns) are imported directly where they are used.
- Only `src/main/` instantiates providers.

Instead of:

`src/use-cases/create-user/create-user.use-case.ts`:

```ts
import { prisma } from '@/providers/prisma/prisma.client'

export class CreateUserUseCase {
  async execute({ name, email }: CreateUserParams): Promise<CreateUserResult> {
    const user = await prisma.user.create({ data: { name, email } })

    return { user }
  }
}
```

Write:

`src/use-cases/create-user/create-user.use-case.ts`:

```ts
import { UserAlreadyExistsError } from '@/domain/user/user.errors'
import type { UsersRepository } from '@/domain/user/users.repository'

type CreateUserUseCaseDependencies = {
  usersRepository: UsersRepository
}

export class CreateUserUseCase {
  private readonly usersRepository: UsersRepository

  constructor({ usersRepository }: CreateUserUseCaseDependencies) {
    this.usersRepository = usersRepository
  }

  async execute({ name, email }: CreateUserParams): Promise<CreateUserResult> {
    const { user: existingUser } = await this.usersRepository.findByEmail({ email })
    if (existingUser) throw new UserAlreadyExistsError({ email })

    const { user } = await this.usersRepository.create({ name, email })

    return { user }
  }
}
```

## 3. Files and folders

Each controller, use case and provider gets its own folder, with the implementation and its spec side by side:

| Unit       | Folder                         | Implementation              | Spec                                              |
| ---------- | ------------------------------ | --------------------------- | ------------------------------------------------- |
| Controller | `src/controllers/create-user/` | `create-user.controller.ts` | `create-user.controller.spec.ts`                  |
| Use case   | `src/use-cases/create-user/`   | `create-user.use-case.ts`   | `create-user.use-case.spec.ts`                    |
| Provider   | `src/providers/prisma/users/`  | `users.repository.ts`       | `users.repository.spec.ts`                        |
| Entity     | `src/domain/user/`             | `user.entity.ts`            | `user.entity.spec.ts`, once it has business rules |

- Controllers and use cases are named after the action, verb first (`create-user`, `list-orders`). A controller shares its name with the use case it calls.
- A provider folder is named after the technology (`prisma`, `stripe`). It holds the shared client (`prisma.client.ts`) and one subfolder per interface it implements (`users/`, `orders/`). Class names carry the technology: `PrismaUsersRepository`.
- An external API follows the same path: the interface sits in the domain folder of the entity it serves (`src/domain/order/payments.gateway.ts`), and the implementation in its technology folder (`src/providers/stripe/payments/payments.gateway.ts`).
- An entity starts as a `type`. Turn it into a class once it carries business rules (validation, state changes, calculations), and give it a spec then.
- A helper (a formatter, a row-to-entity mapper) lives in the folder of the unit that uses it. Create a new folder only for a responsibility that is clear and recurs across features.
- Interfaces, types and errors have no behaviour, so they have no spec. `src/main/` and `src/config/` are covered by the E2E specs.

Use-case specs replace the repository with a mock typed by its interface:

`src/use-cases/create-user/create-user.use-case.spec.ts`:

```ts
import type { UsersRepository } from '@/domain/user/users.repository'
import { CreateUserUseCase } from './create-user.use-case'

describe('CreateUserUseCase', () => {
  it('creates the user when the email is free', async () => {
    const user = { id: 'user-1', name: 'Ana', email: 'ana@email.com' }
    const usersRepository: UsersRepository = {
      findByEmail: vi.fn().mockResolvedValue({ user: null }),
      create: vi.fn().mockResolvedValue({ user }),
    }
    const createUserUseCase = new CreateUserUseCase({ usersRepository })

    const result = await createUserUseCase.execute({ name: 'Ana', email: 'ana@email.com' })

    expect(result).toEqual({ user })
  })
})
```

## 4. Wiring in `src/main/`

- `server.ts` creates the app, registers the routes and the error handler, and starts listening.
- `routes.ts` builds each controller with its dependencies and registers its route. Once it nears the file size limit, split it per resource (`src/main/routes/users.routes.ts`, `src/main/routes/orders.routes.ts`), each registered from `routes.ts`.
- `error-handler.ts` maps domain errors to HTTP status codes (`UserAlreadyExistsError` → 409). Controllers let domain errors propagate to it.
- Middlewares (authentication, rate limiting) live in `src/main/middlewares/`, one per file: `authenticate.middleware.ts`.

`src/main/routes.ts` (Fastify shown; the shape is the same in any framework):

```ts
import type { FastifyInstance } from 'fastify'
import { CreateUserController } from '@/controllers/create-user/create-user.controller'
import { PrismaUsersRepository } from '@/providers/prisma/users/users.repository'
import { CreateUserUseCase } from '@/use-cases/create-user/create-user.use-case'

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  const usersRepository = new PrismaUsersRepository()
  const createUserUseCase = new CreateUserUseCase({ usersRepository })
  const createUserController = new CreateUserController({ createUserUseCase })

  app.post('/users', (request, reply) => createUserController.handle({ request, reply }))
}
```

## 5. E2E tests

E2E specs live in `e2e/` at the project root, outside `src/`, one per controller action: `e2e/create-user.e2e-spec.ts`. They call the real HTTP server, with real providers against a test database.

Unit and E2E specs run apart, each with its own config and script, so neither suite picks up the other's files:

| Suite | Config                 | Includes               | Script             |
| ----- | ---------------------- | ---------------------- | ------------------ |
| Unit  | `vitest.config.ts`     | `src/**/*.spec.ts`     | `npm test`         |
| E2E   | `vitest.e2e.config.ts` | `e2e/**/*.e2e-spec.ts` | `npm run test:e2e` |

## 6. Adding a feature

1. **Domain**: the entity, its errors and the repository methods the feature needs, in `src/domain/<entity>/`.
2. **Use case**: `src/use-cases/<action>/`.
3. **Provider**: the new repository methods, in `src/providers/<technology>/<repository>/`.
4. **Controller**: `src/controllers/<action>/`.
5. **Route**: wire and register it in `src/main/routes.ts`, and map any new domain error in `src/main/error-handler.ts`.
6. **E2E**: `e2e/<action>.e2e-spec.ts`.

---

Before finishing, check that every file you created sits where this rule places it, every implementation with behaviour has its sibling spec, every import follows the table in section 2, and every new route has an E2E spec.
