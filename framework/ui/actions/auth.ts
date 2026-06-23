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
  await page.waitForURL(/discovery/, { timeout: 30_000 });
}
