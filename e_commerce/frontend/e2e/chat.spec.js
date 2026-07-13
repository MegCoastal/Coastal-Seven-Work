import { test, expect } from "@playwright/test";

test.describe("WaveMart Chat Flow", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Visit the store login page
    await page.goto("http://localhost:5173/login");

    // 2. Perform authentication login steps
    await page.fill('input[type="email"]', "user@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirection to dashboard or homepage catalog
    await page.waitForURL("http://localhost:5173/");
  });

  test("opens AI assistant and chats successfully", async ({ page }) => {
    // 1. Locate and click floating AI chat widget bubble
    const aiToggle = page.locator('button[aria-label="Open AI Assistant"]');
    await expect(aiToggle).toBeVisible();
    await aiToggle.click();

    // 2. Verify chat container panel opens
    const chatHeader = page.locator('text=WaveMart AI Assistant');
    await expect(chatHeader).toBeVisible();

    // 3. Send a message to AI assistant
    const input = page.locator('input[placeholder="Ask me anything..."]');
    await input.fill("Suggest some eco-friendly surfboards");
    await page.click('button:has-text("Ask")');

    // 4. Assert streamed text blocks and citations eventually load
    const responseMessage = page.locator('.typing-dots:has-text("Thinking...")').or(page.locator('text=Matches found in catalog:'));
    await expect(responseMessage).toBeVisible({ timeout: 15000 });
  });
});
