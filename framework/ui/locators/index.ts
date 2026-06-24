import type { Locator, Page } from "@playwright/test";

/**
 * Locators are stateless: (page) => Locator. No clicks, waits, or assertions.
 * Selector priority: getByRole → getByLabel → getByTestId → text/placeholder.
 * Use .or() for resilient variants (e.g. a data-testid that naapp may add later).
 */

export const authLocators = {
  email: (page: Page): Locator =>
    page.getByRole("textbox", { name: /email/i }).or(page.getByTestId("login-email")).first(),
  password: (page: Page): Locator =>
    page.getByRole("textbox", { name: /password/i }).or(page.getByTestId("login-password")).first(),
  signIn: (page: Page): Locator =>
    page.getByRole("button", { name: /sign in/i }).or(page.getByTestId("login-submit")).first(),
};

export const navLocators = {
  chat: (page: Page): Locator =>
    page
      .getByRole("button", { name: /^chat$/i })
      .or(page.getByRole("link", { name: /^chat$/i }))
      .or(page.getByTestId("nav-chat"))
      .first(),
  chatLink: (page: Page): Locator =>
    page
      .getByRole("link", { name: /chat/i })
      .or(page.getByRole("button", { name: /^chat$/i }))
      .or(page.getByTestId("nav-chat"))
      .first(),
  discovery: (page: Page): Locator =>
    page
      .getByRole("button", { name: /^discovery$/i })
      .or(page.getByRole("link", { name: /^discovery$/i }))
      .or(page.getByTestId("nav-discovery"))
      .first(),
  discoveryLink: (page: Page): Locator =>
    page
      .getByRole("link", { name: /discovery/i })
      .or(page.getByRole("button", { name: /^discovery$/i }))
      .or(page.getByTestId("nav-discovery"))
      .first(),
};

export const discoveryLocators = {
  narrativeClustersTab: (page: Page): Locator =>
    page.getByRole("link", { name: /narrative clusters/i }).first(),
  search: (page: Page): Locator =>
    page
      .getByRole("searchbox", { name: /search narrative clusters/i })
      .or(page.getByTestId("clusters-search"))
      .first(),
  firstFeedCard: (page: Page): Locator =>
    page.getByTestId("feed-card").first().or(page.getByRole("listitem").first()),
  articleRow: (page: Page): Locator => page.getByRole("row").or(page.getByTestId("article-row")),
};

export const chatLocators = {
  composer: (page: Page): Locator =>
    page.getByRole("textbox", { name: /ask anything/i }).or(page.getByTestId("chat-composer")).first(),
  send: (page: Page): Locator =>
    page.getByRole("button", { name: /send message/i }).or(page.getByTestId("chat-send")).first(),
  response: (page: Page, text: string | RegExp): Locator => page.getByText(text),
  /** Assistant response bubble (naapp marks it with `data-herald-response`). */
  assistantResponse: (page: Page): Locator =>
    page.getByTestId("assistant-message").or(page.locator("[data-herald-response]")).first(),
  /** Retry/regenerate control — absent on reloaded terminal turns today. */
  retryButton: (page: Page): Locator =>
    page.getByRole("button", { name: /try again|retry|regenerate/i }),
};

export const keyTopicLocators = {
  accordionTrigger: (page: Page): Locator =>
    page.getByRole("button", { name: /key topics/i }).first(),
  firstItem: (page: Page): Locator =>
    page.getByTestId("key-message-item").first().or(page.getByRole("checkbox").first()),
  newKeyMessageButton: (page: Page): Locator =>
    page.getByRole("button", { name: /new key message|create key message/i }).first(),
  keyMessageNameInput: (page: Page): Locator =>
    page
      .getByRole("textbox", { name: /key message name/i })
      .or(page.getByPlaceholder(/key message name/i))
      .first(),
};

export const analysisLocators = {
  askComposer: (page: Page): Locator =>
    page
      .getByRole("textbox", { name: /ask anything about this page/i })
      .or(page.getByPlaceholder(/ask anything about this page/i))
      .or(page.getByTestId("analysis-composer"))
      .first(),
};

export const briefingLocators = {
  getBriefingCta: (page: Page): Locator =>
    page
      .getByRole("textbox", { name: /get a briefing|ask anything about your business/i })
      .or(page.getByPlaceholder(/get a briefing|ask anything about your business/i))
      .or(page.getByRole("button", { name: /get a briefing/i }))
      .first(),
};
