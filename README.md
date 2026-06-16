# iBud

**Tests in English, run by AI.**

iBud is an end-to-end testing platform where you write tests as plain-English
markdown and an AI agent executes them against a real browser. The first time a
test runs, the agent figures out how to drive the UI and **records every
successful action as a deterministic script**. Subsequent runs **replay that
script without AI** — fast, cheap, and stable. If a replay breaks because the
app changed, iBud automatically **re-engages the agent to heal** the test and
re-records it.

Hand-written **Playwright specs** (`*.spec.ts`) are supported too, so you can
mix AI-driven tests with conventional code-based ones in the same suite and run
view.

---

## How it works

Every test run picks one of four modes automatically:

| Mode | When it runs | AI used? |
|------|--------------|----------|
| **`ai`** | First run of an English test (no cached script yet) | ✅ Agent drives the browser and records a script |
| **`replay`** | A valid cached script exists | ❌ Deterministic replay of recorded commands |
| **`healed`** | A replay failed (app likely changed) | ✅ Agent re-runs the test, re-records on success |
| **`playwright`** | The test is a `*.spec.ts` file | ❌ Runs through the Playwright CLI |

```
English test (*.test.md)
        │
        ▼
  cached script?  ──no──▶  AI executor ──pass──▶ record script  ──▶ ✅
        │                       │
       yes                     fail ──▶ ❌
        ▼
   replay script  ──pass──▶ ✅
        │
       fail (app changed)
        ▼
   AI heal + re-record  ──pass──▶ ✅ / fail ──▶ ❌
```

The AI executor is built on **Claude Opus 4.8** (`@anthropic-ai/sdk` tool
runner). It's given a small toolbox — `snapshot`, `act`, `find_act`, `wait`,
`assert`, `report_step`, `finish` — that wrap the [`agent-browser`](https://www.npmjs.com/package/agent-browser)
CLI. Successful commands are appended to a trace; the trace becomes the
replayable script. The agent is explicitly told never to use ephemeral snapshot
refs in actions, so recorded scripts survive replay.

A cached script is keyed by the test file's **content hash** — edit the test and
the old script is treated as stale, forcing a fresh AI run.

---

## Two kinds of test

### 1. English tests — `tests/**/*.test.md`

Front-matter plus a numbered list of steps. `Expect …` steps become assertions.
`${VAR}` placeholders are resolved from the environment at run time (the stored
text keeps the placeholder, so secrets never get persisted).

```markdown
---
name: User can log in
url: /auth/login
tags: [auth, smoke]
---

1. Fill the Email field with "${HANDRAISE_EMAIL}"
2. Fill the Password field with "${HANDRAISE_PASSWORD}"
3. Click the "Sign In" button
4. Expect the page URL to contain "discovery"
5. Expect the text "Narrative Clusters" to be visible
```

### 2. Playwright specs — `tests/**/*.spec.ts`

Conventional Playwright tests. iBud parses each `test('…')` title into a run
step and streams pass/fail, screenshots, **trace**, and **video** into the run
view. Specs use a layered structure:

- `framework/ui/locators/` — locator modules (the only place raw selectors live)
- `framework/ui/actions/` — behavior functions that consume locators (e.g. `login`)
- `setup/auth.setup.ts` — logs in once and writes `storageState`; the smoke
  suite reuses it instead of logging in per test

---

## Architecture

```
src/
  app/                      Next.js 16 dashboard (App Router) + API routes
    api/tests/              GET — discover tests + last-run status
    api/runs/               POST — start a run · GET — list runs
    api/runs/[id]/          GET — run + steps · /stream — SSE live events
    api/screenshots/[...]   serve step screenshots from data/
    api/artifacts/[...]     serve Playwright trace.zip / video.webm
    page.tsx, tests/[id], runs/[id]   dashboard, test detail, live run view
  lib/
    discovery.ts            find/parse *.test.md and *.spec.ts
    runner.ts               orchestrates mode selection + run lifecycle
    executor.ts             AI agent loop (Claude + agent-browser tools)
    replayer.ts             deterministic replay of cached scripts
    playwright.ts           spawn Playwright CLI + map results to steps
    browser.ts              thin wrapper around the agent-browser CLI
    trace.ts                cached-script load/save + expectation checks
    events.ts               in-process event bus (powers SSE streaming)
    config.ts, env.ts       config loading + ${VAR} / .env.local handling
  db/
    schema.ts               Drizzle schema: tests, runs, run_steps
    index.ts                better-sqlite3 + Drizzle (data/ibud.db, WAL)
  components/               RunView, RunButton, status badges
framework/ui/               Playwright locators + actions
setup/auth.setup.ts         programmatic auth → storageState
scripts/dev.mjs             dev launcher (free port + agent-browser dashboard)
scripts/pw-reporter.cjs     NDJSON Playwright reporter consumed by playwright.ts
tests/                      *.test.md and *.spec.ts
docs/how-it-works.html      slide deck
```

**State & artifacts** live under `data/` (gitignored):

- `data/ibud.db` — SQLite database (tests, runs, steps)
- `data/scripts/<testId>.json` — recorded replay scripts
- `data/screenshots/<runId>/` — per-step screenshots
- `data/artifacts/<runId>/` — Playwright traces and videos

### Tech stack

- **Next.js 16** (App Router, React 19) — dashboard + API
- **Claude Opus 4.8** via `@anthropic-ai/sdk` — the AI test executor
- **agent-browser** — local browser-automation CLI (isolated session per run)
- **Playwright** — runs `*.spec.ts`, reuses the Chrome for Testing binary that
  agent-browser already installs (no separate `playwright install`)
- **better-sqlite3 + Drizzle ORM** — persistence
- **Zod** — tool input schemas · **gray-matter** — test front-matter ·
  **nanoid** — run IDs · **Tailwind CSS v4** — styling

---

## Getting started

### Prerequisites

- Node.js 20+ and **pnpm**
- An Anthropic API key
- Credentials for the app under test

### 1. Install

```bash
pnpm install
```

### 2. Configure secrets — `.env.local`

```bash
ANTHROPIC_API_KEY=sk-ant-...
HANDRAISE_EMAIL=you@example.com
HANDRAISE_PASSWORD=...
# optional: override the Playwright base URL
# E2E_BASE_URL=https://naapp-stage2.handraise.site
```

`.env*` is gitignored. Existing shell env vars always win over `.env.local`.

### 3. Adjust `ibud.config.json` if needed

```json
{
  "baseUrl": "https://naapp-stage2.handraise.site",
  "testDir": "tests",
  "dataDir": "data",
  "headless": true,
  "agentBrowserDashboardUrl": "http://localhost:4848"
}
```

### 4. Run the dashboard

```bash
pnpm dev
```

This picks the first free port from `3000` up, starts the **agent-browser
observability dashboard** (default `http://localhost:4848`), then `next dev`.
Open the printed URL, pick a test, and watch it run live (steps stream over SSE
with screenshots; Playwright runs also surface trace + video).

---

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start the dashboard + agent-browser dashboard |
| `pnpm run-test tests/login.test.md` | Run a single test from the CLI, streaming progress to the terminal |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Apply the Drizzle schema to `data/ibud.db` |
| `pnpm exec playwright test` | Run the Playwright suite directly (setup → smoke) |

---

## Notes for contributors

This project pins **Next.js 16**, which has breaking changes from earlier
versions. Per `AGENTS.md`, consult the bundled docs in
`node_modules/next/dist/docs/` before writing app/router code rather than
relying on prior Next.js knowledge.
