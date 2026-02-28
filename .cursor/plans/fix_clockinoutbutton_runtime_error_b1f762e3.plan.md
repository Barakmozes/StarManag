---
name: Fix ClockInOutButton runtime error
overview: The `ClockInOutButton` runtime error occurs because `graphql/generated.ts` does not contain the `GetActiveClockInDocument`, `ClockInDocument`, or `ClockOutDocument` exports — they are `undefined` at runtime, causing urql to crash on `.__key`. The fix is to run GraphQL codegen to regenerate the types from the new `.graphql` files.
todos:
  - id: start-dev
    content: Start the dev server so the GraphQL schema endpoint is available for introspection
    status: completed
  - id: run-codegen
    content: Run `yarn codegen` to regenerate graphql/generated.ts with the new TimeEntry/Shift/ShiftTemplate types
    status: in_progress
  - id: verify
    content: Verify graphql/generated.ts now exports the required documents and the runtime error is resolved
    status: pending
isProject: false
---

# Fix ClockInOutButton `__key` runtime error

## Root Cause

`ClockInOutButton.tsx` imports `GetActiveClockInDocument`, `ClockInDocument`, and `ClockOutDocument` from `@/graphql/generated`. These types/documents were defined in `[graphql/files/timeentry.graphql](graphql/files/timeentry.graphql)` but codegen has not been re-run since the file was added. The imports resolve to `undefined` at runtime, and urql crashes accessing `.__key` on `undefined`.

## Fix

1. **Start the dev server** (codegen introspects the live schema at `http://localhost:3000/api/graphql` per `[codegen.yml](codegen.yml)`):

```bash
yarn dev
```

1. **Run codegen** to regenerate `[graphql/generated.ts](graphql/generated.ts)` with the new TimeEntry/Shift/ShiftTemplate queries and mutations:

```bash
yarn codegen
```

1. **Verify** that `graphql/generated.ts` now exports `GetActiveClockInDocument`, `ClockInDocument`, `ClockOutDocument`, and all other new types from `timeentry.graphql`, `shift.graphql`, and `shifttemplate.graphql`.
2. **Reload the page** to confirm the `__key` error is gone and `ClockInOutButton` renders.

## Why This Works

The `codegen.yml` config picks up all `./graphql/files/**/*.graphql` documents and generates typed urql document nodes into `graphql/generated.ts`. After codegen, the imports in `ClockInOutButton.tsx` resolve to real `DocumentNode` objects instead of `undefined`.