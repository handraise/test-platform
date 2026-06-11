import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// Load .env.local so specs can read credentials from process.env, both when
// run standalone (`playwright test`) and when spawned by the iBud runner.
const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined && m[2] !== "") {
      process.env[m[1]] = m[2];
    }
  }
}

/**
 * Drive the Chrome for Testing binary that agent-browser already installed,
 * so there's no separate `playwright install` download.
 */
const chromePath = path.join(
  os.homedir(),
  ".agent-browser/browsers/chrome-149.0.7827.55",
  "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
);

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    screenshot: "on",
    launchOptions: { executablePath: chromePath },
  },
});
