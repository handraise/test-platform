import { test, expect } from "@playwright/test";
import { openChat, sendChatPrompt } from "../../framework/ui/actions";
import { chatLocators } from "../../framework/ui/locators";

// Authenticated via seeded storageState (smoke project).
test("authenticated user opens chat to its initial state", { tag: ["@smoke"] }, async ({ page }) => {
  await page.goto("/discovery");
  await openChat(page);

  await expect(chatLocators.composer(page)).toBeVisible();
  await expect(chatLocators.composer(page)).toBeEnabled();
});

test("chat lists the available feeds", { tag: ["@smoke"] }, async ({ page }) => {
  await page.goto("/discovery");
  await openChat(page);

  await sendChatPrompt(page, "List all of available feeds");

  // Assert on stable feed names rather than exact wording (chat output varies).
  await expect(chatLocators.response(page, "Datadog")).toBeVisible({ timeout: 90_000 });
  await expect(chatLocators.response(page, "WP Engine")).toBeVisible();
});
