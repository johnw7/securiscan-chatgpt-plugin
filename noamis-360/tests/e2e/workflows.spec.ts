import { expect, test } from "@playwright/test";
import { idOf, login, loginAdmin, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });

const stamp = Date.now().toString(36);
const clientName = `Client E2E ${stamp}`;

test("PILOT : créer un client, un contact, une mission et une tâche", async ({ page }) => {
  await login(page, USERS.consultant, /\/dashboard/);
  await page.goto("/pilot/clients");
  await page.getByRole("button", { name: "Nouveau client" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Raison sociale / nom").fill(clientName);
  await dialog.getByLabel("Ville").fill("Versailles");
  await dialog.getByLabel("Adresse", { exact: true }).fill("3 rue du Test");
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(clientName);

  await page.getByRole("tab", { name: /Contacts/ }).click();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("dialog").getByLabel("Prénom").fill("Jeanne");
  await page.getByRole("dialog").getByRole("textbox", { name: "Nom", exact: true }).fill("Essai");
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Jeanne Essai")).toBeVisible();

  await page.getByRole("tab", { name: /Missions/ }).click();
  await page.getByRole("button", { name: "Nouvelle mission" }).click();
  await page.getByRole("dialog").getByLabel("Intitulé de la mission").fill(`Audit E2E ${stamp}`);
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/\/pilot\/missions\//);
  await expect(page.getByText(/MIS-\d{4}-\d{3}/).first()).toBeVisible();

  await page.getByRole("tab", { name: /Tâches/ }).click();
  await page.getByRole("button", { name: "Nouvelle tâche" }).click();
  await page.getByRole("dialog").getByLabel("Tâche").fill("Visite de site E2E");
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Visite de site E2E")).toBeVisible();
});

test("Validation des formulaires côté client et serveur", async ({ page }) => {
  await login(page, USERS.consultant);
  await page.goto("/pilot/clients");
  await page.getByRole("button", { name: "Nouveau client" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Raison sociale / nom").fill("A");
  await dialog.getByLabel("SIRET").fill("123");
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(dialog.getByText("SIRET : 14 chiffres")).toBeVisible();
  await expect(dialog.getByText(/2 caractères minimum/)).toBeVisible();
});

test("FINANCE : devis depuis le catalogue puis envoi au portail", async ({ page }) => {
  await login(page, USERS.consultant);
  await page.goto("/finance/quotes");
  await page.getByRole("button", { name: "Nouveau devis" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Objet").fill(`Audit boutique ${stamp}`);
  await dialog.getByLabel("Client").selectOption({ label: "Boutique Horizon (fictive)" });
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/\/finance\/quotes\//);
  await page.getByLabel("Ajouter une prestation du catalogue").selectOption({ label: "AUD-STD — Audit de sûreté de site" });
  await expect(page.locator("td", { hasText: "Audit de sûreté de site" })).toBeVisible();
  await expect(page.locator("dd", { hasText: "1 800,00 €" }).last()).toBeVisible();
  await page.getByRole("button", { name: "Envoyer" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Envoyé", { exact: true })).toBeVisible();
});

test("CONNECT : le client A accepte le devis en ligne et ne voit rien du client B", async ({ page }) => {
  await login(page, USERS.clientA, /\/portal/);
  await page.goto("/portal/finance");
  const row = page.locator("li", { hasText: `Audit boutique ${stamp}` });
  await row.getByRole("button", { name: "Accepter" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "J'accepte" }).click();
  await expect(row.getByText("Accepté")).toBeVisible();

  // Données du client B (scénarios 2 et 3 via l'application).
  const missionB = await idOf("missions", "title", "AMOA vidéoprotection entrepôt");
  await page.goto(`/portal/missions/${missionB}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await expect(page.getByText("AMOA vidéoprotection entrepôt")).toHaveCount(0);
  const r = await page.request.get(`/api/pdf/quote/${missionB}`);
  expect(r.status()).toBe(404);
  // Pages internes inaccessibles.
  await page.goto("/finance/invoices");
  await expect(page).toHaveURL(/\/portal/);
});

test("Collaborateur : pas d'accès à l'administration ni à l'émission de facture", async ({ page }) => {
  await login(page, USERS.consultant);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/dashboard\?error=forbidden/);
  await page.goto("/finance/quotes");
  await page.getByRole("link", { name: /DEV-/ }).first().click();
  await expect(page.getByRole("button", { name: "Émettre" })).toHaveCount(0);
});

test("Administrateur : MFA obligatoire, conversion en facture, émission, règlement", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/finance/quotes");
  await page.getByText(`Audit boutique ${stamp}`).click();
  await page.getByRole("button", { name: "Convertir en facture" }).click();
  await expect(page).toHaveURL(/\/finance\/invoices\//);
  await page.getByRole("button", { name: "Émettre" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Émettre" }).click();
  await expect(page.getByText(/Document émis sous le numéro FAC-\d{4}-\d{4}/)).toBeVisible();
  await expect(page.getByText("Verrouillée")).toBeVisible();
  await expect(page.getByRole("button", { name: "Modifier" })).toHaveCount(0);
  await page.getByRole("button", { name: "Règlement" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Payée", { exact: true })).toBeVisible();
  const pdf = await page.request.get(page.url().replace("/finance/invoices/", "/api/pdf/invoice/"));
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  await page.goto("/admin/audit-logs?entity=invoices");
  await expect(page.getByRole("heading", { name: "Journal d'audit" })).toBeVisible();
  await expect(page.locator("tbody tr").first()).toBeVisible();
});
