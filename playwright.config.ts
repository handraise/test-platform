import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// Load .env.local so specs/setup can read credentials from process.env, both
// when run standalone (`playwright test`) and when spawned by the iBud runner.
const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined && m[2] !== "") {
      process.env[m[1]] = m[2];
    }
  }
}

// Drive the Chrome for Testing binary that agent-browser already installed on
// macOS dev machines, so there's no separate `playwright install` download.
// In containers (Linux) this macOS app path doesn't exist: prefer an explicit
// PLAYWRIGHT_CHROME_PATH override, otherwise fall back to Playwright's own
// managed Chromium (installed in the Docker image via `playwright install`).
const macChromePath = path.join(
  os.homedir(),
  ".agent-browser/browsers/chrome-149.0.7827.55",
  "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
);
const chromePath =
  process.env.PLAYWRIGHT_CHROME_PATH ||
  (process.platform === "darwin" && fs.existsSync(macChromePath)
    ? macChromePath
    : undefined);

const BASE_URL =
  process.env.E2E_BASE_URL ?? process.env.NAAPP_BASE_URL ?? "https://naapp-stage2.handraise.site";
const STORAGE_STATE =
  process.env.E2E_AUTH_STATE_PATH ?? path.join(process.cwd(), ".auth", "user.json");

export default defineConfig({
  // Each project sets its own testDir (setup/ vs tests/).
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    screenshot: "on",
    // Always capture so iBud can surface them in the run view (local tool,
    // not CI — the perf cost is fine here).
    trace: "on",
    video: "on",
    // When chromePath is undefined, Playwright uses its own managed Chromium.
    launchOptions: chromePath ? { executablePath: chromePath } : {},
  },
  projects: [
    // Programmatic auth: logs in once and writes storageState for the rest.
    {
      name: "setup",
      testDir: "./setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Smoke suite reuses the seeded storageState (no per-test UI login).
    {
      name: "smoke",
      testDir: "./tests",
      testMatch: /smoke\/.*\.smoke\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: STORAGE_STATE },
    },
    {
      name: "e2e",
      testDir: "./tests",
      testMatch: /e2e\/.*\.e2e\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: STORAGE_STATE },
    },
  ],
});
