<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project notes

- Docker image must be **linux/amd64** — agent-browser's Chrome has no ARM64 build. Local: `docker compose up` (browser is emulated/flaky on Apple Silicon).
- Single replica only: in-memory SSE bus + on-disk SQLite/replay scripts. Schema is applied on boot via `pnpm db:push`.
- Tests run against the Handraise stage app; post-login lands on `/chat/new`.
- Deploy infra lives in the Terraform repo (`apps/test-suite/`).
