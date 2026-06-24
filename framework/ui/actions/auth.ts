import { type Page } from "@playwright/test";
import { authLocators } from "../locators";

export interface Credentials {
  email: string;
  password: string;
}

/** Log in through the UI. Used by the direct auth smoke test. */
export async function login(page: Page, credentials: Credentials): Promise<void> {
  await page.goto("/auth/login");
  await authLocators.email(page).fill(credentials.email);
  await authLocators.password(page).fill(credentials.password);
  await authLocators.signIn(page).click();
  // Post-login currently lands on /chat/new; just wait until login is complete.
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), {
    timeout: 30_000,
  });
}
