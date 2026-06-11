import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

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
