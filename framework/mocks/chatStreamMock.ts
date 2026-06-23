import type { Page, Route } from "@playwright/test";

/**
 * Stub the AI SDK resume GET (`/chat/:id/stream`) as "no active stream" (204).
 * This keeps reload specs deterministic by rendering persisted messages only.
 */
export async function mockChatResumeNoActiveStream(page: Page): Promise<void> {
  await page.route("**/chat/*/stream", async (route: Route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({ status: 204, body: "" });
  });
}
