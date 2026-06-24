# iBud test platform — runs Next.js plus real browsers (agent-browser + Playwright).
#
# Build for linux/amd64: agent-browser's Chrome for Testing has no Linux ARM64
# build, so on Apple Silicon use `docker build --platform linux/amd64`.
#
# We deliberately do NOT use Next's `output: standalone`: the app spawns
# node_modules/.bin/agent-browser and node_modules/.bin/playwright at runtime,
# which @vercel/nft cannot trace, so the standalone prune would break runs.
# The full node_modules is kept instead.
#
# Base image ships Chrome + all system libraries Playwright needs. Pin the tag
# to the @playwright/test version in package.json.
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# pnpm via corepack (version comes from package.json packageManager if present).
RUN corepack enable

# Install dependencies first for better layer caching. The postinstall builds
# for agent-browser + better-sqlite3 run here (see pnpm.onlyBuiltDependencies),
# and agent-browser downloads its Chrome for Testing build — the build host must
# have outbound network access.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Install browsers before copying source so app changes don't bust the cache.
# agent-browser ships a Linux binary but downloads Chrome separately — the
# postinstall does NOT do this, so it must be done explicitly or AI test runs
# have no browser. --with-deps pulls any missing system libraries.
RUN pnpm exec agent-browser install --with-deps

# Playwright's own Chromium for *.spec.ts runs (playwright.config falls back to
# it when no macOS agent-browser Chrome path exists).
RUN pnpm exec playwright install chromium

# App source.
COPY . .

# Build the Next.js app.
RUN pnpm build

# Persistent state (SQLite, recorded replay scripts, screenshots, artifacts)
# lives here; mount a volume at /app/data in Kubernetes.
RUN mkdir -p /app/data

EXPOSE 3000

# Schema + dashboard + app. The agent-browser session daemon is spawned on
# demand per run by the app.
CMD ["sh", "scripts/docker-entrypoint.sh"]
