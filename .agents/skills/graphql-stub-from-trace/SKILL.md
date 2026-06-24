---
name: graphql-stub-from-trace
description: Generate a typed mockGraphQL stub from a failed Playwright trace's GraphQL request. Use when a test fails due to noisy or drifting stage2 GraphQL responses.
---

# GraphQL stub from trace

## When to use

- A smoke test fails because stage2 returned unexpected GraphQL data
- You want deterministic PR-gate behavior without mutating stage2

## Steps

1. Open the failing trace with `pnpm exec playwright show-trace ...`.
2. Find the GraphQL request in the Network tab (operation name + variables).
3. Copy the response body or craft a minimal valid subset.
4. Add payload to `framework/data/graphqlFixtures.ts`.
5. Wire `mockGraphQL(page, { operationName, response })` in the spec or a fixture `beforeEach`.
6. Rerun the spec locally and in CI.

## Rules

- Stub only the operations needed for determinism on PR gates.
- Keep live unstubbed paths for nightly where realism matters.
