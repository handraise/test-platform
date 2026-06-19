import { expect, type Page } from "@playwright/test";
import { authLocators, navLocators, chatLocators } from "../locators";

/**
 * Actions are plain async behavior functions. They consume locator modules
 * only — never call page.getByRole or raw selectors directly.
 */

export interface Credentials {
  email: string;
  password: string;
}

/** Log in through the UI. Used by auth.setup.ts to seed storageState. */
export async function login(page: Page, creds: Credentials): Promise<void> {
  await page.goto("/auth/login");
  await authLocators.email(page).fill(creds.email);
  await authLocators.password(page).fill(creds.password);
  await authLocators.signIn(page).click();
  // Resilient to the post-login landing page (currently /chat/new): just wait
  // until we've left the login page.
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), {
    timeout: 30_000,
  });
}

/** Open the Chat area from the left navigation. */
export async function openChat(page: Page): Promise<void> {
  await navLocators.chat(page).click();
  await page.waitForURL(/chat/, { timeout: 30_000 });
}

/** Type a prompt into the chat composer and send it. */
export async function sendChatPrompt(page: Page, prompt: string): Promise<void> {
  const composer = chatLocators.composer(page);
  await expect(composer).toBeVisible();
  await composer.fill(prompt);
  await chatLocators.send(page).click();
}
