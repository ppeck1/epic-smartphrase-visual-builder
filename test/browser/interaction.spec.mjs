import {test, expect} from "@playwright/test";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const releaseUrl = pathToFileURL(path.resolve(testDirectory, "..", "..", "index.html")).href;

test.beforeEach(async ({page}) => {
  // * Future work: add separate focused cases when a workflow earns its own regression.
  await page.addInitScript(() => {
    localStorage.clear();
    let copiedText = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value) => { copiedText = String(value); },
        readText: async () => copiedText
      }
    });
  });
  await page.goto(releaseUrl);
});

test("inline picker, undo, and copy stay connected", async ({page}) => {
  const editor = page.locator('textarea[data-field="text"]').first();

  await page.locator("#phraseName").fill("FOLLOWUP");
  await editor.fill("Hello ");
  await editor.pressSequentially("@");
  await expect(page.locator("#picker")).toBeVisible();

  await editor.pressSequentially("name");
  await expect(page.getByRole("option", {name: /Patient full name/i})).toHaveAttribute("aria-selected", "true");
  await editor.press("Enter");
  await expect(editor).toHaveValue("Hello @NAME@");

  await page.locator('[data-quick="wildcard"]').click();
  await expect(page.locator("#pvBody")).toContainText("***");

  await page.locator("#undoBtn").click();
  await expect(page.locator("#pvBody")).not.toContainText("***");

  await page.locator("#copyBodyBtn").click();

  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("Hello @NAME@");
  await expect(page.locator('#toasts [data-copy="1"]')).toContainText(/^Copied\./);
});
