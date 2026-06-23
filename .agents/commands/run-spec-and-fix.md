# Run spec and fix

Run a single Playwright spec, inspect failure output (trace, screenshot, HTML report), apply minimal fixes, and rerun until green.

Steps:
1. `pnpm exec playwright test <spec-path> --project=smoke`
2. On failure, open trace: `pnpm exec playwright show-trace test-results/.../trace.zip`
3. Fix locator/action/spec per ui-test-standards
4. Rerun the same spec

Do not broaden scope beyond the failing workflow.
