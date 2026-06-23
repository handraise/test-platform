import { expect, test as setup } from "@playwright/test";
import path from "node:path";

const AUTH_STORAGE_KEY = "auth-storage";

type LoginResponse = { access?: string; refresh?: string };

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const authFile = envValue("E2E_AUTH_STATE_PATH") ?? path.join(process.cwd(), ".auth", "user.json");

/**
 * Programmatic auth: log in once over REST, seed naapp's persisted auth state,
 * and let smoke/e2e specs reuse storageState instead of repeating UI login.
 */
setup("authenticate", async ({ request, page }) => {
  const email = envValue("E2E_USER_EMAIL") ?? envValue("HANDRAISE_EMAIL");
  const password = envValue("E2E_USER_PASSWORD") ?? envValue("HANDRAISE_PASSWORD");
  const authUrl = envValue("NAAPP_AUTH_URL") ?? "/api/auth/login";

  if (!email || !password) {
    throw new Error(
      "E2E_USER_EMAIL/E2E_USER_PASSWORD or HANDRAISE_EMAIL/HANDRAISE_PASSWORD must be set.",
    );
  }

  const response = await request.post(authUrl, { data: { email, password } });
  expect(
    response.ok(),
    `REST login failed: ${response.status()} ${response.statusText()}`,
  ).toBeTruthy();

  const { access, refresh } = (await response.json()) as LoginResponse;
  expect(access, "login response did not include an access token").toBeTruthy();

  await page.goto("/");
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    {
      key: AUTH_STORAGE_KEY,
      value: JSON.stringify({
        state: { loggedIn: true, accessToken: access, refreshToken: refresh ?? null },
        version: 0,
      }),
    },
  );

  await page.context().storageState({ path: authFile });
});
