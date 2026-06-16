/**
 * CLI entry: pnpm run-test tests/login.test.md
 * Runs a single test and streams progress to the terminal.
 */
import fs from "node:fs";
import path from "node:path";

// Load .env.local before anything imports the Anthropic SDK.
const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]] && m[2]) process.env[m[1]] = m[2];
  }
}

async function main() {
  const { parseTestFile } = await import("./discovery");
  const { startRun } = await import("./runner");
  const { subscribeRun } = await import("./events");

  const file = process.argv[2];
  if (!file) {
    console.error("Usage: pnpm run-test <path/to/test.test.md>");
    process.exit(1);
  }

  const test = parseTestFile(path.resolve(file));
  console.log(`▶ ${test.name} (${test.steps.length} steps)`);

  const runId = startRun(test);
  console.log(`  run ${runId}\n`);

  await new Promise<void>((resolve) => {
    subscribeRun(runId, (event) => {
      switch (event.type) {
        case "step_update": {
          const icon =
            event.status === "running" ? "…" : event.status === "passed" ? "✓" : "✗";
          console.log(
            `  ${icon} step ${event.stepIndex}${event.note ? ` — ${event.note}` : ""}`,
          );
          break;
        }
        case "agent_note":
          console.log(`  ℹ ${event.text}`);
          break;
        case "run_finished":
          console.log(
            `\n${event.status === "passed" ? "✅ PASSED" : "❌ " + event.status.toUpperCase()} (mode: ${event.mode})${event.error ? `\n${event.error}` : ""}`,
          );
          process.exitCode = event.status === "passed" ? 0 : 1;
          resolve();
          break;
      }
    });
  });
}

main();
