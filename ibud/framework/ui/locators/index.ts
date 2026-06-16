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
    page.getByRole("button", { name: /^chat$/i }).or(page.getByTestId("nav-chat")).first(),
  discovery: (page: Page): Locator =>
    page.getByRole("button", { name: /^discovery$/i }).or(page.getByTestId("nav-discovery")).first(),
};

export const discoveryLocators = {
  narrativeClustersTab: (page: Page): Locator =>
    page.getByRole("link", { name: /narrative clusters/i }).first(),
  search: (page: Page): Locator =>
    page.getByRole("searchbox", { name: /search narrative clusters/i }).or(page.getByTestId("clusters-search")).first(),
};

export const chatLocators = {
  composer: (page: Page): Locator =>
    page.getByRole("textbox", { name: /ask anything/i }).or(page.getByTestId("chat-composer")).first(),
  send: (page: Page): Locator =>
    page.getByRole("button", { name: /send message/i }).or(page.getByTestId("chat-send")).first(),
  response: (page: Page, text: string | RegExp): Locator => page.getByText(text),
};
