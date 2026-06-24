<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mise Workflow

- Use `mise.toml` as the source of truth for local tools, tasks, and developer workflows.
- Before editing `mise.toml`, `hk.pkl`, hooks, or tool setup, read `.agents/skills/mise-fy/SKILL.md` and the relevant reference file under `.agents/skills/mise-fy/references/`.
- Run tasks through `mise run <task>` instead of ad-hoc shell commands when a task exists.
- Prefer standard task names: `setup`, `deps`, `check`, `lint`, `test`, `build`, and `dev`.
- Use namespaced tasks for variants, for example `test:smoke`, `test:e2e`, and `docker:up`.
- Keep direct tasks and 1Password-backed tasks separate. Use `*:op` tasks when `.env` contains `op://...` references.
- Do not commit generated setup state; `.mise/setup` is intentionally ignored.

# Validation

- Use `mise run check` before declaring code changes done.
- Use `mise run test:list` when you only need to verify Playwright project/test discovery.
- Use `mise run test:smoke` or `mise run test:e2e` only when the required app credentials are configured.
- Use `mise run docker:up` for the production-like local container workflow; Docker Engine/Desktop is an external prerequisite that mise does not install.

# Extending Tasks

- Add short tasks directly to `mise.toml`; move longer shell logic into executable file tasks under `.mise/tasks/` if needed.
- Scope task-only environment variables to the task instead of global `[env]`.
- Use `[vars]` for reusable task config that should not be exported as environment.
- Gate destructive Docker or data-reset tasks with `confirm`.

# Project notes

- Docker image must be **linux/amd64** — agent-browser's Chrome has no ARM64 build. Local: `docker compose up` (browser is emulated/flaky on Apple Silicon).
- Single replica only: in-memory SSE bus + on-disk SQLite/replay scripts. Schema is applied on boot via `pnpm db:push`.
- Tests run against the Handraise stage app; post-login lands on `/chat/new`.
- Deploy infra lives in the Terraform repo (`apps/test-suite/`).
