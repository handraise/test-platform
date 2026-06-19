import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { login } from "../framework/ui/actions";

const authFile = path.join(process.cwd(), ".auth", "user.json");

/**
 * Programmatic auth: log in once, persist storageState, and let every smoke
 * test reuse it. (REST login → storageState is the eventual target per the
 * proposal; this UI-seeded variant needs no naapi contract to start.)
 */
setup("authenticate", async ({ page }) => {
  const email = process.env.HANDRAISE_EMAIL;
  const password = process.env.HANDRAISE_PASSWORD;
  if (!email || !password) {
    throw new Error("HANDRAISE_EMAIL / HANDRAISE_PASSWORD must be set (see .env.local)");
  }

  await login(page, { email, password });
  await expect(page).toHaveURL(/\/chat\//);
  await page.context().storageState({ path: authFile });
});
