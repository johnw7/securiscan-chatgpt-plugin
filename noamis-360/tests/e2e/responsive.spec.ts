import { expect, test } from "@playwright/test";
import { login, USERS } from "./helpers";

test.describe("Interfaces mobiles", () => {
  test("pas de défilement horizontal et menu mobile accessible", async ({ page }) => {
    await login(page, USERS.consultant);
    for (const path of ["/dashboard", "/pilot/clients", "/finance/invoices", "/audit"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Missions" })).toBeVisible();
  });

  test("portail client et diagnostic sur mobile", async ({ page }) => {
    await page.goto("/diagnostic");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await login(page, USERS.clientA, /\/portal/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
});
