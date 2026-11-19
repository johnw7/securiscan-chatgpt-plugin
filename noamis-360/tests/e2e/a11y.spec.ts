import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { login, USERS } from "./helpers";

async function audit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`), path).toEqual([]);
}

test.describe("Accessibilité WCAG 2.2 AA (axe-core) — aucune violation grave ou critique", () => {
  test("pages publiques", async ({ page }) => {
    for (const path of ["/", "/login", "/diagnostic", "/confidentialite", "/forgot-password"]) await audit(page, path);
  });
  test("espace NOAMIS", async ({ page }) => {
    await login(page, USERS.consultant);
    for (const path of ["/dashboard", "/pilot/clients", "/pilot/leads", "/pilot/missions", "/pilot/tasks", "/pilot/calendar", "/audit", "/project", "/intelligence", "/docs", "/finance", "/finance/invoices", "/connect"]) await audit(page, path);
  });
  test("portail client", async ({ page }) => {
    await login(page, USERS.clientA);
    for (const path of ["/portal", "/portal/missions", "/portal/documents", "/portal/finance", "/portal/messages"]) await audit(page, path);
  });
  test("navigation au clavier : lien d'évitement et focus visible", async ({ page }) => {
    await page.goto("/login");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
    await page.keyboard.press("Tab");
    // Indicateur de focus : contour ou anneau (box-shadow) visible.
    const style = await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement!);
      return { outline: cs.outlineStyle, shadow: cs.boxShadow };
    });
    expect(style.outline !== "none" || style.shadow !== "none").toBe(true);
  });
});
