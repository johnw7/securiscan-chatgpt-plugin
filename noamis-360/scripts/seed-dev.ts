/**
 * Données de DÉVELOPPEMENT — entièrement fictives (e-mails en .test,
 * numéros de la plage ARCEP réservée à la fiction 01 99 00 xx xx).
 * Refuse de s'exécuter ailleurs que sur une instance Supabase locale.
 *
 * Usage : node scripts/seed-dev.ts
 */
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_METHODOLOGY, DEFAULT_TEMPLATE } from "../src/features/audit/default-template.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
  throw new Error(`Refus : le jeu de données fictif ne doit jamais être chargé hors environnement local (${url}).`);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const ins = (table: string, rows: unknown) => db.from(table).insert(rows as never, { defaultToNull: false });
export const DEV_PASSWORD = "Noamis-Dev-2026!";

// Script de développement : typage souple volontaire des réponses PostgREST non typées.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
async function must(p: PromiseLike<{ data: Any; error: unknown }>, label: string): Promise<Any> {
  const { data, error } = await p;
  if (error) throw new Error(`${label} : ${JSON.stringify(error)}`);
  return data;
}

async function user(email: string, fullName: string) {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users.find((u) => u.email === email);
  if (existing) return existing.id;
  const data = await must(
    db.auth.admin.createUser({ email, password: DEV_PASSWORD, email_confirm: true, user_metadata: { full_name: fullName } }),
    `user ${email}`,
  );
  return data.user!.id;
}

async function main() {
  const existing = await must(db.from("organizations").select("id").eq("is_default", true).maybeSingle(), "org");
  if (existing) {
    console.log("Données déjà présentes : rien à faire (lancer `supabase db reset` pour repartir de zéro).");
    return;
  }
  const org = await must(
    ins("organizations", {
        name: "NOAMIS Sûreté Conseil (DÉMO)",
        legal_name: "Organisation de démonstration",
        legal_form: "Entrepreneur individuel",
        siren: "000000000",
        address_line: "1 rue de l'Exemple",
        postal_code: "78100",
        city: "Saint-Germain-en-Laye",
        email: "contact@noamis.test",
        phone: "01 99 00 00 00",
        is_default: true,
        vat_regime: "franchise",
      })
      .select("id")
      .single(),
    "organisation",
  );

  const superAdmin = await user("direction@noamis.test", "Direction NOAMIS (démo)");
  const admin = await user("admin@noamis.test", "Camille Admin (démo)");
  const consultant = await user("consultant@noamis.test", "Alex Consultant (démo)");
  const consultant2 = await user("analyste@noamis.test", "Sam Analyste (démo)");
  const clientUserA = await user("client.a@exemple.test", "Dominique Client A (démo)");
  const clientUserB = await user("client.b@exemple.test", "Morgan Client B (démo)");

  const clients = await must(
    ins("clients", [
        { organization_id: org.id, name: "Boutique Horizon (fictive)", category: "commerce", status: "actif", address_line: "10 place du Marché", postal_code: "78100", city: "Saint-Germain-en-Laye", email: "contact@horizon.test", phone: "01 99 00 01 01", owner_id: consultant },
        { organization_id: org.id, name: "Logistique Atlas SAS (fictive)", category: "entreprise", status: "actif", siren: "111111111", address_line: "ZA des Tests", postal_code: "95000", city: "Cergy", email: "securite@atlas.test", phone: "01 99 00 02 02", owner_id: admin },
        { organization_id: org.id, name: "Commune de Valdemo (fictive)", category: "collectivite", status: "prospect", postal_code: "78000", city: "Valdemo" },
        { organization_id: org.id, name: "Famille Exemple (fictive)", category: "particulier", status: "actif", address_line: "5 allée des Essais", postal_code: "78100", city: "Saint-Germain-en-Laye" },
      ])
      .select("id, name"),
    "clients",
  );
  const [horizon, atlas, valdemo, famille] = clients as Array<{ id: string }>;

  await must(
    ins("memberships", [
      { organization_id: org.id, user_id: superAdmin, role: "super_admin" },
      { organization_id: org.id, user_id: admin, role: "admin" },
      { organization_id: org.id, user_id: consultant, role: "collaborator" },
      { organization_id: org.id, user_id: consultant2, role: "collaborator" },
      { organization_id: org.id, user_id: clientUserA, role: "client", client_id: horizon!.id },
      { organization_id: org.id, user_id: clientUserB, role: "client", client_id: atlas!.id },
    ]),
    "memberships",
  );

  await must(
    ins("contacts", [
      { organization_id: org.id, client_id: horizon!.id, first_name: "Dominique", last_name: "Exemple", job_title: "Gérante", email: "client.a@exemple.test", phone: "01 99 00 01 10", is_primary: true },
      { organization_id: org.id, client_id: atlas!.id, first_name: "Morgan", last_name: "Test", job_title: "Directeur des opérations", email: "client.b@exemple.test", is_primary: true },
      { organization_id: org.id, client_id: valdemo!.id, first_name: "Claude", last_name: "Fiction", job_title: "DGS", email: "dgs@valdemo.test" },
    ]),
    "contacts",
  );

  const d = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const missions = await must(
    ins("missions", [
        { organization_id: org.id, client_id: horizon!.id, service_type: "audit_surete", title: "Audit de sûreté de la boutique", status: "en_cours", progress: 45, manager_id: consultant, created_by: consultant, start_date: d(-20), end_date: d(25), budget: 1800, description: "Diagnostic complet des dispositifs de sûreté et recommandations hiérarchisées." },
        { organization_id: org.id, client_id: atlas!.id, service_type: "amoa", title: "AMOA vidéoprotection entrepôt", status: "en_cours", progress: 30, manager_id: admin, created_by: admin, start_date: d(-40), end_date: d(80), budget: 6500 },
        { organization_id: org.id, client_id: atlas!.id, service_type: "gestion_crise", title: "Préparation gestion de crise (confidentiel)", status: "planifiee", progress: 0, manager_id: admin, created_by: admin, is_confidential: true, start_date: d(10), budget: 3200 },
        { organization_id: org.id, client_id: famille!.id, service_type: "prevention_cambriolage", title: "Prévention cambriolage domicile", status: "terminee", progress: 100, manager_id: consultant, created_by: consultant, start_date: d(-90), end_date: d(-60), budget: 650 },
      ])
      .select("id, client_id"),
    "missions",
  );

  await must(
    ins("tasks", [
      { organization_id: org.id, mission_id: missions[0]!.id, title: "Rédiger le rapport d'audit", assignee_id: consultant, due_date: d(7), priority: "haute", status: "en_cours", client_visible: true },
      { organization_id: org.id, mission_id: missions[0]!.id, title: "Visite de contrôle nocturne", assignee_id: consultant, due_date: d(-2), priority: "normale" },
      { organization_id: org.id, mission_id: missions[1]!.id, title: "Préparer le dossier de consultation", assignee_id: admin, due_date: d(12), priority: "haute", client_visible: true },
      { organization_id: org.id, title: "Mettre à jour la veille mensuelle", assignee_id: consultant2, due_date: d(3) },
    ]),
    "tasks",
  );

  await must(
    ins("leads", [
      { organization_id: org.id, title: "Sûreté siège social", company: "Groupe Fictif", contact_name: "Pat Démo", email: "pat@fictif.test", stage: "proposition", source: "recommandation", estimated_amount: 4500, probability: 60, owner_id: admin, expected_close_date: d(20), category: "entreprise" },
      { organization_id: org.id, title: "Prévention home-jacking dirigeant", contact_name: "Lou Essai", stage: "qualifie", source: "reseau", estimated_amount: 2400, probability: 40, owner_id: consultant, category: "dirigeant" },
      { organization_id: org.id, title: "Diagnostic commerce centre-ville", company: "Café Démo", stage: "nouveau", source: "protect", estimated_amount: 900, probability: 20, category: "commerce" },
      { organization_id: org.id, title: "Programme prévention collectivité", company: "Commune de Valdemo (fictive)", client_id: valdemo!.id, stage: "negociation", source: "site", estimated_amount: 9000, probability: 70, owner_id: admin, category: "collectivite" },
    ]),
    "leads",
  );

  const now = Date.now();
  await must(
    ins("calendar_events", [
      { organization_id: org.id, title: "Visite de site — Boutique Horizon", kind: "visite_site", starts_at: new Date(now + 2 * 86400000).toISOString(), ends_at: new Date(now + 2 * 86400000 + 7200000).toISOString(), location: "Saint-Germain-en-Laye", client_id: horizon!.id, mission_id: missions[0]!.id, owner_id: consultant },
      { organization_id: org.id, title: "Comité de pilotage Atlas", kind: "reunion", starts_at: new Date(now + 5 * 86400000).toISOString(), ends_at: new Date(now + 5 * 86400000 + 3600000).toISOString(), client_id: atlas!.id, mission_id: missions[1]!.id, owner_id: admin },
    ]),
    "events",
  );

  const tpl = await must(
    ins("audit_templates", { organization_id: org.id, name: DEFAULT_TEMPLATE.name, description: DEFAULT_TEMPLATE.description, categories: DEFAULT_TEMPLATE.categories, questions: DEFAULT_TEMPLATE.questions, scoring: DEFAULT_TEMPLATE.scoring })
      .select("id")
      .single(),
    "template",
  );
  const audit = await must(
    ins("audits", { organization_id: org.id, client_id: horizon!.id, mission_id: missions[0]!.id, template_id: tpl.id, title: "Audit sûreté boutique Horizon", site_name: "Boutique Horizon", site_address: "Saint-Germain-en-Laye", audit_date: d(-5), auditor_id: consultant, status: "en_cours", methodology: DEFAULT_METHODOLOGY, created_by: consultant, answers: { "controle_acces-1": { value: "partiel", comment: "Porte de service non contrôlée" }, "videoprotection-1": { value: "conforme" } } })
      .select("id")
      .single(),
    "audit",
  );
  const obs = await must(
    ins("audit_observations", { organization_id: org.id, audit_id: audit.id, category: "controle_acces", title: "Porte de service sans contrôle", description: "La porte arrière reste ouverte pendant les livraisons.", is_vulnerability: true, location: "Réserve" }).select("id").single(),
    "observation",
  );
  const risk = await must(
    ins("risk_assessments", { organization_id: org.id, audit_id: audit.id, observation_id: obs.id, category: "controle_acces", threat: "Vol à l'étalage organisé via la réserve", vulnerability: "Accès arrière non contrôlé", likelihood: 3, impact: 3, level: "Élevé", justification: "Accès ouvert de façon prolongée sans surveillance visuelle, valeur du stock significative.", criteria: { exposition: "Zone commerçante fréquentée", mesures: "Aucune" } }).select("id").single(),
    "risk",
  );
  await must(
    ins("recommendations", { organization_id: org.id, audit_id: audit.id, risk_id: risk.id, title: "Installer un ferme-porte et une alarme d'ouverture prolongée", priority: "P1", horizon: "3_mois", estimated_cost: 600, status: "proposee" }),
    "reco",
  );

  const project = await must(
    ins("projects", { organization_id: org.id, client_id: atlas!.id, mission_id: missions[1]!.id, name: "Renouvellement vidéoprotection entrepôt", phase: "analyse_offres", budget: 45000, start_date: d(-40), end_date: d(120), specification: "Couverture des quais, du parking et des accès piétons. Conservation 30 jours. Exploitation locale.", created_by: admin }).select("id").single(),
    "project",
  );
  const vendors = await must(
    ins("vendors", [
      { organization_id: org.id, name: "Installateur Alpha (fictif)", specialty: "Vidéoprotection", city: "Paris" },
      { organization_id: org.id, name: "Sécurité Bêta (fictif)", specialty: "Vidéoprotection, contrôle d'accès", city: "Versailles" },
      { organization_id: org.id, name: "Gamma Systèmes (fictif)", specialty: "Courants faibles", city: "Nanterre" },
    ]).select("id"),
    "vendors",
  );
  const criteria = await must(
    ins("selection_criteria", [
      { organization_id: org.id, project_id: project.id, label: "Adéquation technique au cahier des charges", weight: 40, position: 0 },
      { organization_id: org.id, project_id: project.id, label: "Prix", weight: 30, position: 1 },
      { organization_id: org.id, project_id: project.id, label: "Délais et planning", weight: 15, position: 2 },
      { organization_id: org.id, project_id: project.id, label: "Maintenance et SAV", weight: 15, position: 3 },
    ]).select("id"),
    "criteria",
  );
  const sc = (a: number, b: number, c: number, e: number) => Object.fromEntries((criteria as Array<{ id: string }>).map((cr, i) => [cr.id, [a, b, c, e][i]]));
  await must(
    ins("vendor_offers", [
      { organization_id: org.id, project_id: project.id, vendor_id: vendors[0]!.id, amount_ht: 41200, delay_weeks: 8, scores: sc(8, 6, 7, 8) },
      { organization_id: org.id, project_id: project.id, vendor_id: vendors[1]!.id, amount_ht: 38900, delay_weeks: 10, scores: sc(7, 8, 6, 7) },
      { organization_id: org.id, project_id: project.id, vendor_id: vendors[2]!.id, amount_ht: 46500, delay_weeks: 6, scores: sc(9, 4, 8, 6) },
    ]),
    "offers",
  );
  await must(
    ins("milestones", [
      { organization_id: org.id, project_id: project.id, title: "Validation du cahier des charges", due_date: d(-20), status: "atteint", completed_at: new Date().toISOString(), position: 0 },
      { organization_id: org.id, project_id: project.id, title: "Choix du prestataire", due_date: d(10), status: "en_cours", position: 1 },
      { organization_id: org.id, project_id: project.id, title: "Réception des travaux", due_date: d(110), status: "a_venir", position: 2 },
    ]),
    "milestones",
  );
  await must(
    ins("project_decisions", { organization_id: org.id, project_id: project.id, kind: "decision", title: "Conservation des images fixée à 30 jours", decided_by: "Comité de pilotage", decided_at: d(-15), status: "close" }),
    "decisions",
  );

  await must(
    ins("service_catalog", [
      { organization_id: org.id, code: "AUD-STD", name: "Audit de sûreté de site", unit: "forfait", unit_price: 1800, vat_rate: 0, service_type: "audit_surete" },
      { organization_id: org.id, code: "AMOA-J", name: "Journée d'AMOA", unit: "jour", unit_price: 750, vat_rate: 0, service_type: "amoa" },
      { organization_id: org.id, code: "RI-PONC", name: "Analyse ponctuelle Risk Intelligence", unit: "forfait", unit_price: 950, vat_rate: 0, service_type: "risk_intelligence" },
      { organization_id: org.id, code: "PREV-DOM", name: "Diagnostic prévention cambriolage domicile", unit: "forfait", unit_price: 650, vat_rate: 0, service_type: "prevention_cambriolage" },
    ]),
    "catalog",
  );

  const src = await must(
    ins("intelligence_sources", [
      { organization_id: org.id, name: "Source institutionnelle (exemple)", url: "https://www.example.org/", kind: "institutionnel", reliability: "A", themes: ["cambriolage", "prévention"], collection_allowed: false },
      { organization_id: org.id, name: "Flux d'actualité (exemple)", url: "https://www.example.com/", feed_url: "https://www.example.com/feed.xml", kind: "flux_rss", reliability: "C", themes: ["actualité"], collection_allowed: true },
    ]).select("id"),
    "sources",
  );
  await must(
    ins("intelligence_reports", { organization_id: org.id, kind: "bulletin", title: "Bulletin de veille — exemple", summary: "Synthèse fictive destinée aux démonstrations.", body: "Contenu de démonstration.", themes: ["cambriolage"], source_refs: [{ title: "Article d'exemple", url: "https://www.example.org/article", date: d(-3), source: "Source institutionnelle (exemple)", reliability: "A", credibility: 2 }], status: "brouillon", author_id: consultant2 }),
    "reports",
  );
  void src;

  await must(
    ins("messages", { organization_id: org.id, client_id: horizon!.id, mission_id: missions[0]!.id, sender_id: consultant, body: "Bonjour, la visite de contrôle est confirmée pour jeudi. Bien cordialement." }),
    "messages",
  );

  console.log("Jeu de données fictif créé. Comptes (mot de passe commun « %s ») :", DEV_PASSWORD);
  console.log("  direction@noamis.test (super-admin, MFA requise), admin@noamis.test (admin, MFA requise),");
  console.log("  consultant@noamis.test, analyste@noamis.test (collaborateurs), client.a@exemple.test, client.b@exemple.test (clients)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
