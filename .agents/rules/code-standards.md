# Code Standards

Apply these standards to all code you write or change, in any language. Leave unrelated code as it is unless the task asks for a refactor. When a project's linter, formatter or framework config enforces a different convention, the config wins.

Examples are in TypeScript; the principles apply to every language.

## 1. Self-documenting code

Let names and structure explain the code, so it reads without comments. Reserve comments for the rare spots where the code cannot carry the meaning by itself:

- a complex regular expression
- a well-defined business rule whose _why_ is invisible in the code (a legal requirement, a contractual limit, a deliberate edge case)

A comment states _why_, never _what_.

Instead of:

```ts
// check if user is an adult
if (user.age >= 18) {
  // send the email
  await send(user)
}
```

Write:

```ts
const LEGAL_AGE = 18

const isAdult = user.age >= LEGAL_AGE

if (isAdult) await sendWelcomeEmail({ user })
```

Comments that earn their place:

```ts
// CPF: 11 digits, with optional dots and dash (000.000.000-00)
const CPF_PATTERN = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/

// Orders above this amount go to manual fraud review (risk team policy)
const MANUAL_REVIEW_THRESHOLD = 5000
```

## 2. Single responsibility

Each function, class and module does one thing. A function whose name needs "and" is two functions. Split long code into named functions that each do one step, so the top-level function reads as a summary of its steps:

```ts
async function placeOrder({ cart, customer }: PlaceOrderParams): Promise<PlaceOrderResult> {
  const { items } = validateCart({ cart })
  const { total } = calculateTotal({ items, customer })
  const { paymentId } = await chargeCustomer({ customer, amount: total })
  const { order } = await saveOrder({ items, customer, paymentId })

  return { order }
}
```

## 3. Control flow

### Guard clauses

Handle invalid and edge cases first with an early return, so the main path stays flat at the end of the function. Keep nesting to two levels at most, and drop the `else` after a `return`.

Instead of:

```ts
function getDiscount({ user }: GetDiscountParams): GetDiscountResult {
  if (user) {
    if (user.isActive) {
      if (user.orderCount > 10) {
        return { discount: 0.15 }
      } else {
        return { discount: 0.05 }
      }
    } else {
      return { discount: 0 }
    }
  }
  return { discount: 0 }
}
```

Write:

```ts
const LOYALTY_MIN_ORDERS = 10
const LOYALTY_DISCOUNT = 0.15
const REGULAR_DISCOUNT = 0.05
const NO_DISCOUNT = 0

function getDiscount({ user }: GetDiscountParams): GetDiscountResult {
  if (!user?.isActive) return { discount: NO_DISCOUNT }
  if (user.orderCount > LOYALTY_MIN_ORDERS) return { discount: LOYALTY_DISCOUNT }

  return { discount: REGULAR_DISCOUNT }
}
```

### Lookup maps

When branching on one value across three or more cases, replace the `if/else` chain or `switch` with a lookup map.

Instead of:

```ts
if (status === 'pending') return { label: 'Awaiting payment' }
else if (status === 'paid') return { label: 'Payment confirmed' }
else if (status === 'shipped') return { label: 'On the way' }
else return { label: 'Delivered' }
```

Write:

```ts
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Awaiting payment',
  paid: 'Payment confirmed',
  shipped: 'On the way',
  delivered: 'Delivered',
}

function getStatusLabel({ status }: GetStatusLabelParams): GetStatusLabelResult {
  return { label: STATUS_LABELS[status] }
}
```

Map values can be functions, replacing a `switch` that picks a behaviour:

```ts
const PAYMENT_PROCESSORS: Record<PaymentMethod, PaymentProcessor> = {
  pix: processPix,
  creditCard: processCreditCard,
  boleto: processBoleto,
}

const { receipt } = await PAYMENT_PROCESSORS[method]({ amount })
```

## 4. Naming

- Function names start with a verb and state exactly what the function does: `fetchUserById`, `calculateShippingCost`, `sendInvoiceEmail`. Name the specific action: `parseCsvRows` over `handleData`.
- Booleans read as yes/no questions, with an `is`, `has`, `can` or `should` prefix: `isActive`, `hasPermission`, `canRefund`.
- Spell words out: `customerAddress` over `custAddr`.

## 5. Named constants over magic values

A literal is magic when its meaning is not obvious from the value itself, or when the code compares against it. Extract it into a named constant. Self-explanatory text, such as error and log messages, stays inline.

Instead of:

```ts
if (password.length < 8) throw new Error('Password too short')
setTimeout(retryPayment, 300000)
```

Write:

```ts
const MIN_PASSWORD_LENGTH = 8
const RETRY_DELAY_IN_MS = 5 * 60 * 1000

if (password.length < MIN_PASSWORD_LENGTH) throw new Error('Password too short')
setTimeout(retryPayment, RETRY_DELAY_IN_MS)
```

## 6. Declare variables next to their use

Declare each variable right before the code that first uses it, in the narrowest scope that needs it. Related lines stay together, and guard clauses exit before unneeded work runs. Module-level constants sit right above the first function that uses them.

Instead of:

```ts
const { discount } = calculateDiscount({ customer })
const { shippingCost } = await quoteShipping({ address: customer.address })
const availableItems = cart.items.filter(isAvailable)

if (availableItems.length === 0) return { error: CHECKOUT_ERROR.emptyCart }

const { subtotal } = sumPrices({ items: availableItems })
```

Write:

```ts
const availableItems = cart.items.filter(isAvailable)
if (availableItems.length === 0) return { error: CHECKOUT_ERROR.emptyCart }

const { subtotal } = sumPrices({ items: availableItems })
const { discount } = calculateDiscount({ customer })
const { shippingCost } = await quoteShipping({ address: customer.address })
```

## 7. Secrets and configuration

Keep secrets and environment-specific values (API keys, tokens, passwords, connection strings, per-environment URLs) in `.env`, outside the source code.

- List `.env` in `.gitignore`. Commit a `.env.example` with every key and an empty or fake value.
- Name environment variables in UPPER_SNAKE_CASE: `DATABASE_URL`, `STRIPE_SECRET_KEY`.
- Read environment variables in a single config module that validates them at startup, so a missing variable fails at boot rather than at first use. The rest of the code imports from that module instead of reading the environment directly.
- Keep secrets out of logs, error messages and fallback defaults.

Instead of:

```ts
const stripe = new Stripe('sk_live_51H8xYz...')
const apiKey = process.env.API_KEY || 'dev-key-123'
```

Write:

```ts
const stripe = new Stripe(env.STRIPE_SECRET_KEY)
```

`.env.example`:

```dotenv
DATABASE_URL=
STRIPE_SECRET_KEY=
PORT=3000
```

## 8. Error handling

- Catch an error only where you can handle it or add context; let everything else propagate. Every `catch` either handles the error or rethrows it with context.
- Throw error instances (the language's base error or a domain subclass), never strings or plain objects.
- Error messages say what failed and carry the identifiers needed to investigate it.

Instead of:

```ts
try {
  await paymentGateway.charge({ amount })
} catch (error) {}
```

Write:

```ts
try {
  await paymentGateway.charge({ amount })
} catch (error) {
  throw new Error(`Failed to charge order ${orderId}`, { cause: error })
}
```

## 9. Dead code

Ship only live code: remove unused imports, variables and functions, commented-out blocks, and debugging prints (`console.log` and the like). Intentional logs go through the project's logger.

---

Before finishing, check every function and file you changed against each section above.
