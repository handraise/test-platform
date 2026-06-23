# Scaffold smoke spec

Generate locator, action, and smoke spec stubs for a new naapp feature area.

Inputs:
- Feature name (kebab-case)
- Primary route(s)
- Key user behavior to verify

Outputs:
1. Locator entries in `framework/ui/locators/<feature>.ts` or index exports
2. Action functions in `framework/ui/actions/<feature>.ts`
3. `tests/smoke/<feature>.smoke.spec.ts` with `{ tag: ["@smoke"] }`

Follow `.agents/rules/ui-test-standards.mdc`; no raw selectors in specs or actions.
