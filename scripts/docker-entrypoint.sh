#!/bin/sh
# Schema (idempotent), then the dashboard on a loopback port fronted by a
# forwarder so the published 4848 reaches it, then the app as PID 1.
set -e
pnpm db:push
pnpm exec agent-browser dashboard start --port 14848 &
node scripts/dash-proxy.mjs &
exec pnpm start
