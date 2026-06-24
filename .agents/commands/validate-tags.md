# Validate tags

Ensure every test uses Playwright structured tags and rejects unknown or title-embedded tags.

Allowed tags (extend as needed):
- `@smoke`
- `@e2e`
- `@api`
- `@a11y`
- `@nightly`
- `@responsive`

Reject:
- Tags embedded in test titles, e.g. `test("@smoke opens chat")`
- Unknown tags without team approval

Scan `tests/**/*.spec.ts` and report violations.
