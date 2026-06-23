# Grade UI test spec

Audit the given spec plus its locator and action files against `.agents/rules/ui-test-standards.mdc`.

Checklist:
- Spec does not use raw selectors
- Actions consume locators only
- Locators are stateless `(page) => Locator`
- Test has structured tags, e.g. `{ tag: ["@smoke"] }`
- Test name avoids "should"
- Selector priority is respected

Return a pass/fail table with file:line references for violations.
