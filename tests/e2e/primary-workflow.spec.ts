import { expect, test } from "@playwright/test";

for (const scenario of ["clean", "partial-write-recovery"] as const) {
  test(`${scenario} journey produces an evidence-bound terminal state`, async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Messy retail data in");
    await page.getByLabel(scenario === "clean" ? "Clean execution" : "Partial write + recovery").check();
    await page.getByRole("button", { name: "Run governed workflow" }).click();

    await expect(page.getByRole("heading", { name: "The action exists, not just the status." })).toBeVisible();
    await expect(page.locator("#proof").getByText(scenario === "clean" ? "RECONCILED" : "RECOVERED", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Instacart fit")).toBeVisible();
    if (scenario === "clean" && testInfo.project.name === "chromium") {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
      await page.screenshot({ path: "docs/screenshots/aislebridge-workspace.png", fullPage: true });
    }
    expect(consoleErrors).toEqual([]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("primary action is keyboard operable", async ({ page }) => {
  await page.goto("/");
  const action = page.getByRole("button", { name: "Run governed workflow" });
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "The action exists, not just the status." })).toBeVisible();
});
