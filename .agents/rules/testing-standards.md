# Testing Standards

Apply these standards to backend, frontend and E2E tests.

## 1. Coverage

**Every code change ships with automated tests that cover it. This is a critical rule.**

- Line, function and branch coverage (where the runner measures it) stay at 80% or more, enforced by the test runner so the run fails below it.
- Depth follows business risk. A checkout flow gets success, failure, boundary and recovery cases; a product-category form gets its main path and validations.
- Coverage is a floor: each test asserts a requirement. Code without behaviour (types, constants, config) gets no tests written just to raise the number, and critical code gets its cases even when the total is already above 80%.

Vitest enforces the threshold in its config (`vitest.config.ts`, or the `test` block of `vite.config.ts`), with `npm test` running `vitest run --coverage`:

```ts
test: {
  restoreMocks: true,
  coverage: {
    provider: 'v8',
    thresholds: { lines: 80, branches: 80, functions: 80 },
  },
}
```

In a Bun project that runs `bun test`, the same threshold goes in `bunfig.toml`:

```toml
[test]
coverage = true
coverageThreshold = 0.8
restoreMocks = true
```

## 2. FIRST

Tests follow the FIRST principles, Timely aside:

- **Fast**: unit tests replace slow and external dependencies (network, database, queues, third-party APIs) with stubs typed by their interface.
- **Independent**: each test builds its own data and passes whatever order the tests run in. No test reads state another one wrote.
- **Repeatable**: the clock, random values and external responses are fixed by the test: `vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))`. Mocks are restored after each test (`restoreMocks: true`).
- **Self-validating**: every test asserts the outcome that proves the requirement: the returned value, the final state, the side effect, or the call to a dependency.

```ts
it('charges the order total through the payment gateway', async () => {
  const paymentGateway: PaymentGateway = {
    charge: vi.fn().mockResolvedValue({ paymentId: 'payment-1' }),
  }
  const placeOrderUseCase = new PlaceOrderUseCase({ paymentGateway })

  const result = await placeOrderUseCase.execute({ items: [{ price: 50, quantity: 2 }] })

  expect(paymentGateway.charge).toHaveBeenCalledWith({ amount: 100 })
  expect(result).toEqual({ status: 'approved', paymentId: 'payment-1' })
})
```

## 3. Test structure

- Each test follows Arrange-Act-Assert (or Given-When-Then), with a blank line between the phases.
- Each test checks one behaviour. Several small tests beat one test with many reasons to fail.
- `describe` names the unit; `it` states the condition and the expected result: `it('rejects checkout when the cart is empty')`.

```ts
describe('validateUser', () => {
  it('returns INVALID_EMAIL when the email has no domain', () => {
    const input = { email: 'ana@' }

    const result = validateUser({ input })

    expect(result).toEqual({ isValid: false, error: 'INVALID_EMAIL' })
  })
})
```

## 4. What to test

- **Backend**: business rules, HTTP contracts (status codes, payloads, error responses) and the effects that matter (a record saved, an email queued).
- **Frontend**: what the user sees and does. Query by role, label or text (`getByRole('button', { name: 'Place order' })`), interact through `@testing-library/user-event`, and assert on the screen, not on internal state or class names.
- **Test doubles**: replace what is external or slow, and keep real the collaboration the test exists to verify. Integration tests run against controlled dependencies: a test database, a local fake server.

## 5. Test pyramid

| Level       | Amount   | Covers                                                                                  |
| ----------- | -------- | --------------------------------------------------------------------------------------- |
| Unit        | Many     | Business rules, validations, edge cases, data transformations, components, hooks        |
| Integration | Fewer    | HTTP contracts, providers against a test database, collaboration between modules        |
| E2E         | A few    | Critical flows end to end, as the user runs them: sign-in, checkout, order confirmation |

Each level checks what the level below can't: in a checkout, price calculation is unit-tested, the payment provider is integration-tested, and the purchase flow is covered once by E2E.

## 6. Order of work

1. List the requirements and rank the flows by business risk.
2. Write unit tests for the critical business rules, backend and frontend.
3. Add unit tests for validations, error states, boundaries and data transformations.
4. Add integration tests for HTTP contracts, persistence and module collaboration.
5. Add E2E specs for the critical flows.
6. Run the suite, read the failures and the coverage gaps, then cover the less critical cases.

## 7. Tools

- **Unit and integration**: Vitest, in the backend and the frontend; `bun test` in Bun projects.
- **Placement**: each unit spec sits next to the file it tests, as `<file>.spec.ts` (`.spec.tsx` for components).
- **E2E**: Playwright, one spec per flow in `e2e/`, named `<flow>.e2e-spec.ts`.

```ts
import { expect, test } from '@playwright/test'

test('customer completes checkout with an approved payment', async ({ page }) => {
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Place order' }).click()

  await expect(page.getByText('Order confirmed')).toBeVisible()
})
```

---

Before finishing, run the unit suite with coverage and the E2E suite of every app you changed. The task is done when both pass, coverage stays at 80% or more, and every critical scenario you touched has a test.
