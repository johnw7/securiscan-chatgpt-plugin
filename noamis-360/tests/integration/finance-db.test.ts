/**
 * Scénario 11 : les opérations financières conservent leur cohérence.
 * Exécuté contre la base PostgreSQL locale (triggers et RPC réels).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PoolClient } from "pg";
import { as, closePool, createFixture, pgError, type Fixture } from "../helpers/db";

let f: Fixture;
beforeAll(async () => {
  f = await createFixture();
});
afterAll(closePool);

const adminMfa = () => ({ kind: "user" as const, id: f.admin, aal: "aal2" as const });
const collab = () => ({ kind: "user" as const, id: f.collab, aal: "aal1" as const });
const clientA = () => ({ kind: "user" as const, id: f.clientUserA, aal: "aal1" as const });

async function draftInvoice(c: PoolClient, lines: Array<[number, number, number, number]>, discount = 0) {
  const inv = (
    await c.query(
      "insert into public.invoices (client_id, title, discount_rate) values ($1, 'Mission de conseil', $2) returning id",
      [f.clientA, discount],
    )
  ).rows[0].id as string;
  for (const [i, [qty, pu, rem, vat]] of lines.entries()) {
    await c.query(
      `insert into public.invoice_items (invoice_id, position, description, quantity, unit_price, discount_rate, vat_rate)
       values ($1, $2, 'Prestation', $3, $4, $5, $6)`,
      [inv, i, qty, pu, rem, vat],
    );
  }
  return inv;
}

const totals = async (c: PoolClient, id: string) =>
  (await c.query("select * from public.invoices where id = $1", [id])).rows[0];

describe("Calcul des totaux en base", () => {
  it("applique remises ligne et globale, TVA par taux, arrondis au centime", async () => {
    // Organisation au régime normal pour tester la TVA.
    await as(adminMfa(), async (c) => {
      await c.query("update public.organizations set vat_regime = 'normal' where id = $1", [f.org]);
      const id = await draftInvoice(c, [
        [3, 333.33, 10, 20],
        [1.5, 99.99, 0, 10],
        [1, 0.05, 0, 20],
      ], 5);
      const t = await totals(c, id);
      // Lignes : 899.99 (TVA 20) + 149.99 (TVA 10) + 0.05 (TVA 20)
      expect(t.subtotal_ht).toBe("1050.03");
      // Bases après remise 5 % : 20 % → round(900.04 × 0.95) = 855.04 ; 10 % → round(149.99 × 0.95) = 142.49
      expect(t.total_ht).toBe("997.53");
      expect(t.discount_amount).toBe("52.50");
      // TVA : 171.01 + 14.25
      expect(t.total_vat).toBe("185.26");
      expect(t.total_ttc).toBe("1182.79");
    });
  });

  it("recalcule après modification ou suppression d'une ligne", async () => {
    await as(adminMfa(), async (c) => {
      const id = await draftInvoice(c, [[2, 100, 0, 0], [1, 50, 0, 0]]);
      expect((await totals(c, id)).total_ttc).toBe("250.00");
      await c.query("delete from public.invoice_items where invoice_id = $1 and position = 1", [id]);
      expect((await totals(c, id)).total_ttc).toBe("200.00");
    });
  });
});

describe("Émission et intégrité des factures", () => {
  it("un collaborateur ne peut pas émettre une facture", async () => {
    const code = await pgError(
      as(collab(), async (c) => {
        const id = await draftInvoice(c, [[1, 100, 0, 0]]);
        await c.query("select public.issue_invoice($1)", [id]);
      }),
    );
    expect(code).toBe("42501");
  });

  it("l'émission directe par UPDATE du statut est interdite", async () => {
    const code = await pgError(
      as(adminMfa(), async (c) => {
        const id = await draftInvoice(c, [[1, 100, 0, 0]]);
        await c.query("update public.invoices set status = 'emise' where id = $1", [id]);
      }),
    );
    expect(code).not.toBeNull();
  });

  it("numérote séquentiellement, fige les informations et verrouille la facture", async () => {
    await as(adminMfa(), async (c) => {
      const a = await draftInvoice(c, [[1, 100, 0, 0]]);
      const b = await draftInvoice(c, [[1, 200, 0, 0]]);
      const na = (await c.query("select public.issue_invoice($1) as n", [a])).rows[0].n as string;
      const nb = (await c.query("select public.issue_invoice($1) as n", [b])).rows[0].n as string;
      expect(na).toMatch(/^FAC-\d{4}-\d{4}$/);
      const seq = (n: string) => Number(n.split("-")[2]);
      expect(seq(nb)).toBe(seq(na) + 1);

      const inv = await totals(c, a);
      expect(inv.status).toBe("emise");
      expect(inv.seller_snapshot.siren).toBe("123456789");
      expect(inv.client_snapshot.city).toBe("Saint-Germain-en-Laye");
      expect(inv.legal_mentions.vat).toBe("TVA non applicable, art. 293 B du CGI");
      expect(inv.legal_mentions.recovery_fee).toContain("40 €");
      expect(inv.due_date).not.toBeNull();

      // Niveau 1 (RLS) : aucune ligne modifiable par un utilisateur.
      expect((await c.query("update public.invoices set title = 'modifié' where id = $1", [a])).rowCount).toBe(0);
      // Niveau 2 (déclencheur) : refus même en contournant la RLS (clé de service).
      await c.query("set local role service_role");
      await c.query("savepoint s1");
      expect(await pgError(c.query("update public.invoices set title = 'modifié' where id = $1", [a]))).toBe("23514");
      await c.query("rollback to savepoint s1");
      expect(await pgError(c.query("update public.invoices set total_ttc = 1 where id = $1", [a]))).toBe("23514");
      await c.query("rollback to savepoint s1");
      expect(
        await pgError(c.query("update public.invoice_items set unit_price = 1 where invoice_id = $1", [a])),
      ).toBe("23514");
    });
  });

  it("une facture émise ne peut pas être supprimée, même par l'administrateur", async () => {
    await as(adminMfa(), async (c) => {
      const a = await draftInvoice(c, [[1, 100, 0, 0]]);
      await c.query("select public.issue_invoice($1)", [a]);
      const count = (await c.query("delete from public.invoices where id = $1", [a])).rowCount;
      expect(count).toBe(0);
    });
  });

  it("refuse une TVA non nulle sous le régime de franchise", async () => {
    const code = await pgError(
      as(adminMfa(), async (c) => {
        await c.query("update public.organizations set vat_regime = 'franchise' where id = $1", [f.org]);
        const id = await draftInvoice(c, [[1, 100, 0, 20]]);
        await c.query("select public.issue_invoice($1)", [id]);
      }),
    );
    expect(code).toBe("23514");
  });
});

describe("Règlements et avoirs", () => {
  it("met à jour le statut selon les règlements et refuse le trop-perçu", async () => {
    await as(adminMfa(), async (c) => {
      const id = await draftInvoice(c, [[1, 1000, 0, 0]]);
      await c.query("select public.issue_invoice($1)", [id]);
      await c.query("insert into public.payments (invoice_id, amount) values ($1, 400)", [id]);
      expect((await totals(c, id)).status).toBe("partiellement_payee");
      await c.query("savepoint s");
      expect(await pgError(c.query("insert into public.payments (invoice_id, amount) values ($1, 700)", [id]))).toBe("23514");
      await c.query("rollback to savepoint s");
      await c.query("insert into public.payments (invoice_id, amount) values ($1, 600)", [id]);
      const t = await totals(c, id);
      expect(t.status).toBe("payee");
      expect(t.amount_paid).toBe("1000.00");
    });
  });

  it("refuse un règlement sur un brouillon et toute modification d'un règlement", async () => {
    await as(adminMfa(), async (c) => {
      const id = await draftInvoice(c, [[1, 100, 0, 0]]);
      await c.query("savepoint s");
      expect(await pgError(c.query("insert into public.payments (invoice_id, amount) values ($1, 10)", [id]))).toBe("23514");
      await c.query("rollback to savepoint s");
      await c.query("select public.issue_invoice($1)", [id]);
      await c.query("insert into public.payments (invoice_id, amount) values ($1, 10)", [id]);
      expect((await c.query("update public.payments set amount = 1 where invoice_id = $1", [id])).rowCount).toBe(0);
      await c.query("set local role service_role");
      expect(await pgError(c.query("update public.payments set amount = 1 where invoice_id = $1", [id]))).toBe("42501");
    });
  });

  it("un avoir total annule la facture d'origine et porte sa propre numérotation", async () => {
    await as(adminMfa(), async (c) => {
      const id = await draftInvoice(c, [[2, 250, 0, 0]]);
      const num = (await c.query("select public.issue_invoice($1) as n", [id])).rows[0].n;
      const credit = (await c.query("select public.create_credit_note($1) as id", [id])).rows[0].id;
      const cn = await totals(c, credit);
      expect(cn.kind).toBe("avoir");
      expect(cn.total_ttc).toBe("-500.00");
      const creditNumber = (await c.query("select public.issue_invoice($1) as n", [credit])).rows[0].n as string;
      expect(creditNumber).toMatch(/^AV-\d{4}-\d{4}$/);
      expect((await totals(c, credit)).legal_mentions.credited_invoice).toBe(num);
      const orig = await totals(c, id);
      expect(orig.status).toBe("annulee");
      expect(orig.amount_credited).toBe("500.00");
    });
  });
});

describe("Devis", () => {
  it("parcours complet : brouillon → envoyé → accepté par le client → converti", async () => {
    await as(collab(), async (c) => {
      const q = (
        await c.query("insert into public.quotes (client_id, title, valid_until) values ($1, 'Audit de sûreté', current_date + 30) returning id, number", [f.clientA])
      ).rows[0];
      expect(q.number).toMatch(/^DEV-\d{4}-\d{4}$/);
      await c.query(
        "insert into public.quote_items (quote_id, description, quantity, unit_price, vat_rate) values ($1, 'Audit', 1, 1800, 0)",
        [q.id],
      );
      // Le client ne voit pas un brouillon.
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: f.clientUserA, role: "authenticated" })]);
      expect((await c.query("select id from public.quotes where id = $1", [q.id])).rows).toHaveLength(0);
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: f.collab, role: "authenticated" })]);
      await c.query("update public.quotes set status = 'envoye', sent_at = now() where id = $1", [q.id]);
      // Lignes verrouillées après envoi.
      await c.query("savepoint s");
      expect(await pgError(c.query("update public.quote_items set unit_price = 1 where quote_id = $1", [q.id]))).toBe("23514");
      await c.query("rollback to savepoint s");
      // Réponse du client A.
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: f.clientUserA, role: "authenticated" })]);
      await c.query("select public.client_respond_quote($1, true, 'Bon pour accord')", [q.id]);
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: f.collab, role: "authenticated" })]);
      const inv = (await c.query("select public.convert_quote_to_invoice($1) as id", [q.id])).rows[0].id;
      const t = (await c.query("select total_ttc, status from public.invoices where id = $1", [inv])).rows[0];
      expect(t).toEqual({ total_ttc: "1800.00", status: "brouillon" });
      expect((await c.query("select status from public.quotes where id = $1", [q.id])).rows[0].status).toBe("converti");
    });
  });

  it("le client B ne peut pas répondre au devis du client A", async () => {
    const code = await pgError(
      as(collab(), async (c) => {
        const q = (await c.query("insert into public.quotes (client_id, title) values ($1, 'Devis A') returning id", [f.clientA])).rows[0];
        await c.query("update public.quotes set status = 'envoye' where id = $1", [q.id]);
        await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: f.clientUserB, role: "authenticated" })]);
        await c.query("select public.client_respond_quote($1, true, null)", [q.id]);
      }),
    );
    expect(code).toBe("42501");
  });

  it("le client voit ses factures émises mais jamais les brouillons", async () => {
    await as(adminMfa(), async (c) => {
      const draft = await draftInvoice(c, [[1, 100, 0, 0]]);
      const issued = await draftInvoice(c, [[1, 100, 0, 0]]);
      await c.query("select public.issue_invoice($1)", [issued]);
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: f.clientUserA, role: "authenticated" })]);
      const ids = (await c.query("select id from public.invoices")).rows.map((r) => r.id);
      expect(ids).toContain(issued);
      expect(ids).not.toContain(draft);
    });
  });
});

describe("12. Consommation des liens de partage", () => {
  it("expire après la date limite et après le nombre maximal de téléchargements", async () => {
    await as({ kind: "service" }, async (c) => {
      await c.query(
        `insert into public.document_versions (document_id, storage_path, file_name, mime_type, size_bytes, sha256)
         values ($1, $2, 'livrable.pdf', 'application/pdf', 100, repeat('f', 64))`,
        [f.docA, `test/${f.tag}/livrable.pdf`],
      );
      await c.query(
        `insert into public.document_shares (document_id, token_hash, expires_at, max_downloads) values
           ($1, repeat('1', 64), now() + interval '1 hour', 2),
           ($1, repeat('2', 64), now() + interval '1 second', 5)`,
        [f.docA],
      );
      const consume = async (h: string) =>
        (await c.query("select * from public.consume_document_share($1)", [h])).rows.length;
      expect(await consume("1".repeat(64))).toBe(1);
      expect(await consume("1".repeat(64))).toBe(1);
      expect(await consume("1".repeat(64))).toBe(0); // quota atteint
      // Lien expiré : on force l'expiration dans le passé.
      await c.query(
        "update public.document_shares set created_at = now() - interval '2 hours', expires_at = now() - interval '1 hour' where token_hash = repeat('2', 64)",
      );
      expect(await consume("2".repeat(64))).toBe(0);
      // Lien révoqué
      await c.query(
        `insert into public.document_shares (document_id, token_hash, expires_at, revoked_at) values ($1, repeat('3', 64), now() + interval '1 hour', now())`,
        [f.docA],
      );
      expect(await consume("3".repeat(64))).toBe(0);
      expect(await consume("9".repeat(64))).toBe(0); // jeton inconnu
    });
  });
});

describe("Flux métier en base", () => {
  it("un audit ne peut être validé sans cotation, puis fige la méthode", async () => {
    await as(collab(), async (c) => {
      const tpl = (
        await c.query(
          `insert into public.audit_templates (name, scoring) values ('Modèle test', '{"likelihood":{"min":1,"max":4},"impact":{"min":1,"max":4}}') returning id`,
        )
      ).rows[0].id;
      const audit = (
        await c.query("insert into public.audits (client_id, mission_id, template_id, title) values ($1, $2, $3, 'Audit siège') returning id, reference", [
          f.clientA,
          f.missionA,
          tpl,
        ])
      ).rows[0];
      expect(audit.reference).toMatch(/^AUD-\d{4}-\d{3}$/);
      await c.query("savepoint s");
      expect(await pgError(c.query("select public.validate_audit($1)", [audit.id]))).toBe("23514");
      await c.query("rollback to savepoint s");
      await c.query(
        `insert into public.risk_assessments (audit_id, category, threat, likelihood, impact, level, justification)
         values ($1, 'controle_acces', 'Intrusion', 3, 4, 'Élevé', 'Accès secondaire non contrôlé constaté lors de la visite')`,
        [audit.id],
      );
      await c.query("select public.validate_audit($1)", [audit.id]);
      const a = (await c.query("select status, validated_by, scoring_snapshot from public.audits where id = $1", [audit.id])).rows[0];
      expect(a.status).toBe("valide");
      expect(a.validated_by).toBe(f.collab);
      expect(a.scoring_snapshot).not.toBeNull();
      const r = (await c.query("select score, is_validated from public.risk_assessments where audit_id = $1", [audit.id])).rows[0];
      expect(r).toEqual({ score: 12, is_validated: true });
    });
  });

  it("une analyse de veille non validée ne peut pas être diffusée", async () => {
    await as(collab(), async (c) => {
      const r = (
        await c.query("insert into public.intelligence_reports (kind, title, ai_generated) values ('fiche', 'Synthèse IA', true) returning id")
      ).rows[0].id;
      await c.query("savepoint s");
      expect(await pgError(c.query("select public.publish_intelligence_report($1, $2)", [r, [f.clientA]]))).toBe("23514");
      await c.query("rollback to savepoint s");
      expect(await pgError(c.query("update public.intelligence_reports set status = 'diffuse' where id = $1", [r]))).toBe("23514");
    });
  });

  it("modifier un rapport validé le renvoie en brouillon", async () => {
    await as(collab(), async (c) => {
      const r = (
        await c.query(
          "insert into public.intelligence_reports (kind, title, status, validated_by, validated_at) values ('bulletin', 'Bulletin', 'valide', $1, now()) returning id",
          [f.collab],
        )
      ).rows[0].id;
      await c.query("update public.intelligence_reports set body = 'nouveau contenu' where id = $1", [r]);
      const row = (await c.query("select status, validated_by from public.intelligence_reports where id = $1", [r])).rows[0];
      expect(row).toEqual({ status: "brouillon", validated_by: null });
    });
  });

  it("un projet ne peut être clos tant qu'une réserve est ouverte", async () => {
    await as(collab(), async (c) => {
      const p = (await c.query("insert into public.projects (client_id, name) values ($1, 'Projet vidéoprotection') returning id", [f.clientA])).rows[0].id;
      const res = (
        await c.query("insert into public.project_decisions (project_id, kind, title) values ($1, 'reserve', 'Caméra C3 mal orientée') returning id", [p])
      ).rows[0].id;
      await c.query("savepoint s");
      expect(await pgError(c.query("select public.close_project($1, 'fin')", [p]))).toBe("23514");
      await c.query("rollback to savepoint s");
      await c.query("update public.project_decisions set status = 'levee', resolved_at = now() where id = $1", [res]);
      await c.query("select public.close_project($1, 'Réception sans réserve')", [p]);
      expect((await c.query("select status from public.projects where id = $1", [p])).rows[0].status).toBe("clos");
      // Les décisions ne peuvent pas être supprimées (historique).
      expect((await c.query("delete from public.project_decisions where id = $1", [res])).rowCount).toBe(0);
    });
  });

  it("le personnel peut créer une mission et un document (INSERT … RETURNING)", async () => {
    await as(collab(), async (c) => {
      const m = (
        await c.query("insert into public.missions (client_id, service_type, title, is_confidential) values ($1, 'amoa', 'Nouvelle mission', true) returning id, reference", [f.clientA])
      ).rows[0];
      expect(m.reference).toMatch(/^MIS-/);
      const d = (await c.query("insert into public.documents (client_id, mission_id, title) values ($1, $2, 'CR') returning id", [f.clientA, m.id])).rows;
      expect(d).toHaveLength(1);
    });
  });

  it("le diagnostic PROTECT crée un prospect uniquement avec consentement", async () => {
    await as({ kind: "service" }, async (c) => {
      await c.query("update public.organizations set is_default = false where is_default");
      await c.query("update public.organizations set is_default = true where id = $1", [f.org]);
      const anonymous = (
        await c.query("select public.submit_protect_assessment('commerce', '{\"q1\":\"oui\"}', 55, 'intermediaire', '78', repeat('a',64), null) as id")
      ).rows[0].id;
      const row = (await c.query("select lead_id, contact_requested from public.protect_assessments where id = $1", [anonymous])).rows[0];
      expect(row).toEqual({ lead_id: null, contact_requested: false });

      await c.query("savepoint s");
      expect(
        await pgError(
          c.query(
            `select public.submit_protect_assessment('particulier', '{}', 40, 'a_renforcer', '75', repeat('b',64), '{"name":"Jean Test","email":"jean@exemple.test","consent":false}')`,
          ),
        ),
      ).toBe("23514");
      await c.query("rollback to savepoint s");

      const withContact = (
        await c.query(
          `select public.submit_protect_assessment('particulier', '{}', 40, 'a_renforcer', '75', repeat('b',64), '{"name":"Jean Test","email":"jean@exemple.test","consent":true,"wants_appointment":true}') as id`,
        )
      ).rows[0].id;
      const lead = (
        await c.query("select l.source, l.stage, l.consent_at from public.leads l join public.protect_assessments p on p.lead_id = l.id where p.id = $1", [withContact])
      ).rows[0];
      expect(lead.source).toBe("protect");
      expect(lead.stage).toBe("nouveau");
      expect(lead.consent_at).not.toBeNull();
      // Département invalide refusé (pas d'adresse précise).
      expect(
        await pgError(c.query("select public.submit_protect_assessment('commerce', '{}', 50, 'intermediaire', '12 rue de la Paix', null, null)")),
      ).toBe("23514");
    });
  });
});
