/**
 * Dev launcher: picks the first free port (PORT env or 3000 upward),
 * starts the agent-browser observability dashboard, then `next dev`.
 */
import { createServer } from "node:net";
import { spawn } from "node:child_process";

const preferred = Number(process.env.PORT) || 3000;

function isFree(port) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port);
  });
}

let port = preferred;
while (!(await isFree(port))) port += 1;
if (port !== preferred) {
  console.log(`⚠ port ${preferred} is busy — using ${port} instead`);
}

// Idempotent: prints the URL if already running.
const dash = spawn("pnpm", ["exec", "agent-browser", "dashboard", "start"], {
  stdio: "inherit",
});
dash.on("error", () => {});

const next = spawn("pnpm", ["exec", "next", "dev", "-p", String(port)], {
  stdio: "inherit",
});
next.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => next.kill("SIGINT"));
process.on("SIGTERM", () => next.kill("SIGTERM"));
