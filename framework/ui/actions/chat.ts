import { expect, type Page } from "@playwright/test";
import { chatLocators, navLocators } from "../locators";

/** Opens chat from the main navigation. */
export async function openChat(page: Page): Promise<void> {
  await navLocators.chatLink(page).click();
  await page.waitForURL(/\/chat/);
}

/** Opens a persisted conversation by id and waits for its assistant response to render. */
export async function openConversation(page: Page, conversationId: string): Promise<void> {
  await page.goto(`/chat/${conversationId}`);
  await chatLocators.assistantResponse(page).waitFor({ state: "visible" });
}

/** Opens the new-chat route and waits for the composer. */
export async function startNewChat(page: Page): Promise<void> {
  await page.goto("/chat/new");
  await page.waitForURL(/\/chat\/new$/);
  await chatLocators.composer(page).waitFor({ state: "visible" });
}

/** Type a prompt into the chat composer and send it. */
export async function sendChatPrompt(page: Page, prompt: string): Promise<void> {
  const composer = chatLocators.composer(page);
  await expect(composer).toBeVisible();
  await composer.fill(prompt);
  await chatLocators.send(page).click();
}
