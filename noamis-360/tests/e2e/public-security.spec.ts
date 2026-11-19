import { expect, test } from "@playwright/test";

test.describe("Visiteur non connecté (scénarios 1, 6, 9)", () => {
  test("les pages privées redirigent vers la connexion", async ({ page }) => {
    for (const path of ["/dashboard", "/pilot/clients", "/finance/invoices", "/portal", "/admin/users", "/docs"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/login\?next=/);
    }
  });

  test("les routes serveur refusent l'accès sans session (401)", async ({ request }) => {
    const id = "00000000-0000-4000-8000-000000000000";
    for (const url of [`/api/documents/${id}/download`, `/api/pdf/invoice/${id}`, `/api/pdf/audit/${id}`, `/api/xlsx/project/${id}`, "/api/finance/export?from=2026-01-01&to=2026-12-31"]) {
      const r = await request.get(url, { maxRedirects: 0 });
      expect(r.status(), url).toBe(401);
      expect(await r.text()).not.toMatch(/stack|supabase|postgres|SUPABASE_|eyJ/i);
    }
    const up = await request.post("/api/documents", { multipart: { meta: "{}" } });
    expect(up.status()).toBe(401);
  });

  test("un lien de partage invalide renvoie une erreur neutre", async ({ request }) => {
    const r = await request.get("/api/share/" + "x".repeat(43), { maxRedirects: 0 });
    expect(r.status()).toBe(404);
    expect(await r.json()).toEqual({ error: "Lien invalide ou expiré" });
  });

  test("en-têtes de sécurité présents (CSP à nonce, HSTS, anti-clickjacking)", async ({ request }) => {
    const r = await request.get("/login");
    const h = r.headers();
    expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("message de connexion générique (pas d'énumération des comptes)", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill("inconnu@exemple.test");
    await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Identifiants incorrects ou compte inactif.")).toBeVisible();
  });

  test("anti redirection ouverte après connexion", async ({ page }) => {
    await page.goto("/login?next=https://evil.example");
    await page.getByLabel("Adresse e-mail").fill("consultant@noamis.test");
    await page.getByLabel("Mot de passe").fill("Noamis-Dev-2026!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
    expect(new URL(page.url()).host).toBe(new URL(test.info().project.use.baseURL!).host);
  });
});

test.describe("NOAMIS PROTECT (public)", () => {
  test("diagnostic complet, synthèse PDF et absence de collecte d'adresse", async ({ page }) => {
    await page.goto("/diagnostic");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Diagnostic préliminaire de sûreté");
    await page.getByRole("button", { name: /Particulier/ }).click();
    for (let i = 0; i < 12; i++) {
      const sets = page.locator("fieldset");
      for (let g = 0; g < (await sets.count()); g++) await sets.nth(g).getByText("En partie", { exact: true }).click();
      const next = page.getByRole("button", { name: "Suivant" });
      if (await next.isVisible()) await next.click();
      else break;
    }
    await expect(page.getByText(/adresse/i).first()).toBeVisible();
    await page.getByRole("button", { name: /Voir mon résultat/ }).click();
    await expect(page.getByRole("heading", { name: "Votre résultat indicatif" })).toBeVisible();
    await expect(page.getByText("Diagnostic préliminaire — pas un audit de sûreté")).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Télécharger la synthèse/ }).click();
    expect((await download).suggestedFilename()).toBe("Diagnostic-NOAMIS-PROTECT.pdf");
    // Demande de contact sans consentement : bloquée par le navigateur (champ requis).
    await page.getByLabel("Nom et prénom").fill("Visiteur Test");
    await page.getByLabel("E-mail").fill("visiteur@exemple.test");
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByText("votre demande a bien été transmise")).toHaveCount(0);
  });
});
