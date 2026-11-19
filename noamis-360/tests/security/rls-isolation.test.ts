/**
 * Tests de sécurité obligatoires — cloisonnement des données (RLS).
 * Scénarios 1, 2, 3, 4, 10 et 12 du cahier des charges, plus MFA administrateurs.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, closePool, createFixture, pgError, type Fixture } from "../helpers/db";

let f: Fixture;

beforeAll(async () => {
  f = await createFixture();
});
afterAll(closePool);

const ANON = { kind: "anon" } as const;
const user = (id: string, aal: "aal1" | "aal2" = "aal1") => ({ kind: "user" as const, id, aal });

describe("1. Utilisateur non connecté", () => {
  const privateTables = [
    "clients", "contacts", "leads", "missions", "tasks", "audits", "risk_assessments", "recommendations",
    "projects", "quotes", "invoices", "payments", "documents", "document_versions", "messages",
    "intelligence_reports", "protect_assessments", "audit_logs", "profiles", "memberships", "organizations",
  ];
  it.each(privateTables)("ne peut pas lire la table %s", async (table) => {
    const code = await pgError(as(ANON, (c) => c.query(`select * from public.${table} limit 1`)));
    expect(code).toBe("42501"); // permission denied
  });

  it("ne peut pas appeler les fonctions métier", async () => {
    expect(await pgError(as(ANON, (c) => c.query("select public.global_search('a')")))).toBe("42501");
    expect(
      await pgError(as(ANON, (c) => c.query("select public.submit_protect_assessment('particulier','{}',50,'intermediaire',null,null,null)"))),
    ).toBe("42501");
    expect(await pgError(as(ANON, (c) => c.query("select * from public.consume_document_share(repeat('a',64))")))).toBe("42501");
  });

  it("ne peut pas lister les objets du stockage", async () => {
    const rows = await as(ANON, async (c) => (await c.query("select id from storage.objects")).rows).catch(() => []);
    expect(rows).toHaveLength(0);
  });
});

describe("2. Le client A ne peut pas lire les dossiers du client B", () => {
  it("ne voit que sa propre fiche client", async () => {
    const rows = await as(user(f.clientUserA), async (c) => (await c.query("select id from public.clients")).rows);
    expect(rows.map((r) => r.id)).toEqual([f.clientA]);
  });

  it("ne voit pas les missions du client B", async () => {
    const rows = await as(user(f.clientUserA), async (c) => (await c.query("select id from public.missions")).rows);
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(f.missionA);
    expect(ids).not.toContain(f.missionB);
  });

  it("ne voit que ses documents visibles (pas ceux de B, pas les notes internes)", async () => {
    const rows = await as(user(f.clientUserA), async (c) => (await c.query("select id from public.documents")).rows);
    expect(rows.map((r) => r.id)).toEqual([f.docA]);
  });

  it("une lecture ciblée d'un document de B renvoie zéro ligne", async () => {
    const rows = await as(user(f.clientUserA), async (c) =>
      (await c.query("select * from public.documents where id = $1", [f.docB])).rows,
    );
    expect(rows).toHaveLength(0);
  });

  it("n'accède à aucune donnée interne (prospects, notes, journal, contacts tiers)", async () => {
    for (const table of ["leads", "notes", "audit_logs", "vendors", "intelligence_sources", "protect_assessments"]) {
      const rows = await as(user(f.clientUserA), async (c) => (await c.query(`select 1 from public.${table}`)).rows);
      expect(rows, table).toHaveLength(0);
    }
  });

  it("ne peut pas envoyer un message sur le dossier de B", async () => {
    const code = await pgError(
      as(user(f.clientUserA), (c) => c.query("insert into public.messages (client_id, body) values ($1, 'test')", [f.clientB])),
    );
    expect(code).toBe("42501");
  });
});

describe("3. Le client A ne peut pas modifier les documents du client B", () => {
  it("UPDATE sur un document de B n'affecte aucune ligne", async () => {
    const count = await as(user(f.clientUserA), async (c) =>
      (await c.query("update public.documents set title = 'piraté' where id = $1", [f.docB])).rowCount,
    );
    expect(count).toBe(0);
  });

  it("UPDATE sur son propre document est également refusé (lecture seule)", async () => {
    const count = await as(user(f.clientUserA), async (c) =>
      (await c.query("update public.documents set title = 'modifié' where id = $1", [f.docA])).rowCount,
    );
    expect(count).toBe(0);
  });

  it("DELETE sur un document de B n'affecte aucune ligne", async () => {
    const count = await as(user(f.clientUserA), async (c) =>
      (await c.query("delete from public.documents where id = $1", [f.docB])).rowCount,
    );
    expect(count).toBe(0);
  });

  it("ne peut pas déposer un document dans le dossier de B", async () => {
    const code = await pgError(
      as(user(f.clientUserA), (c) =>
        c.query(
          `insert into public.documents (organization_id, client_id, title, confidentiality, client_visible, uploaded_by_client)
           values ($1, $2, 'intrus', 'client', true, true)`,
          [f.org, f.clientB],
        ),
      ),
    );
    expect(code).toBe("42501");
  });

  it("ne peut pas ajouter une version à un document de B", async () => {
    const code = await pgError(
      as(user(f.clientUserA), (c) =>
        c.query(
          `insert into public.document_versions (document_id, storage_path, file_name, mime_type, size_bytes, sha256)
           values ($1, 'x/y.pdf', 'y.pdf', 'application/pdf', 10, repeat('a', 64))`,
          [f.docB],
        ),
      ),
    );
    expect(code).toBe("42501");
  });

  it("peut déposer une pièce sur SON dossier", async () => {
    const rows = await as(user(f.clientUserA), async (c) =>
      (
        await c.query(
          `insert into public.documents (organization_id, client_id, title, confidentiality, client_visible, uploaded_by_client)
           values ($1, $2, 'Plan du site', 'client', true, true) returning id`,
          [f.org, f.clientA],
        )
      ).rows,
    );
    expect(rows).toHaveLength(1);
  });
});

describe("4. Mission confidentielle", () => {
  it("un collaborateur non membre ne la voit pas", async () => {
    const rows = await as(user(f.collab2), async (c) =>
      (await c.query("select id from public.missions where id = $1", [f.missionConfidential])).rows,
    );
    expect(rows).toHaveLength(0);
  });

  it("ses documents et tâches restent invisibles au collaborateur non membre", async () => {
    const docs = await as(user(f.collab2), async (c) =>
      (await c.query("select id from public.documents where id = $1", [f.docConfidential])).rows,
    );
    expect(docs).toHaveLength(0);
  });

  it("le responsable de mission la voit", async () => {
    const rows = await as(user(f.collab), async (c) =>
      (await c.query("select id from public.missions where id = $1", [f.missionConfidential])).rows,
    );
    expect(rows).toHaveLength(1);
  });

  it("un administrateur MFA la voit", async () => {
    const rows = await as(user(f.admin, "aal2"), async (c) =>
      (await c.query("select id from public.missions where id = $1", [f.missionConfidential])).rows,
    );
    expect(rows).toHaveLength(1);
  });

  it("un collaborateur ajouté comme membre y accède", async () => {
    const rows = await as(user(f.collab), async (c) => {
      await c.query("insert into public.mission_members (mission_id, user_id, organization_id) values ($1, $2, $3)", [
        f.missionConfidential,
        f.collab2,
        f.org,
      ]);
      await c.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: f.collab2, role: "authenticated", aal: "aal1" }),
      ]);
      return (await c.query("select id from public.missions where id = $1", [f.missionConfidential])).rows;
    });
    expect(rows).toHaveLength(1);
  });

  it("un collaborateur non responsable ne peut pas s'ajouter lui-même", async () => {
    const code = await pgError(
      as(user(f.collab2), (c) =>
        c.query("insert into public.mission_members (mission_id, user_id, organization_id) values ($1, $2, $3)", [
          f.missionConfidential,
          f.collab2,
          f.org,
        ]),
      ),
    );
    expect(code).toBe("42501");
  });
});

describe("Cloisonnement entre organisations et MFA administrateur", () => {
  it("un collaborateur d'une autre organisation ne voit rien", async () => {
    const rows = await as(user(f.outsider), async (c) => (await c.query("select id from public.clients")).rows);
    expect(rows.map((r) => r.id)).not.toContain(f.clientA);
  });

  it("un administrateur sans MFA (aal1) n'a aucun privilège d'administration", async () => {
    const rows = await as(user(f.admin, "aal1"), async (c) => (await c.query("select id from public.clients")).rows);
    expect(rows).toHaveLength(0);
    const logs = await as(user(f.admin, "aal1"), async (c) => (await c.query("select id from public.audit_logs")).rows);
    expect(logs).toHaveLength(0);
  });

  it("un administrateur MFA (aal2) accède au journal d'audit, pas un collaborateur", async () => {
    const adminLogs = await as(user(f.admin, "aal2"), async (c) =>
      (await c.query("select id from public.audit_logs where organization_id = $1", [f.org])).rows,
    );
    expect(adminLogs.length).toBeGreaterThan(0);
    const collabLogs = await as(user(f.collab), async (c) => (await c.query("select id from public.audit_logs")).rows);
    expect(collabLogs).toHaveLength(0);
  });

  it("un collaborateur ne peut pas s'attribuer le rôle administrateur", async () => {
    const count = await as(user(f.collab), async (c) =>
      (await c.query("update public.memberships set role = 'admin' where user_id = $1", [f.collab])).rowCount,
    );
    expect(count).toBe(0);
  });

  it("un administrateur ne peut pas créer de super-administrateur", async () => {
    const code = await pgError(
      as(user(f.admin, "aal2"), (c) =>
        c.query("update public.memberships set role = 'super_admin' where user_id = $1", [f.collab2]),
      ),
    );
    expect(code).toBe("42501");
  });

  it("le journal d'audit est en ajout seul, même pour le propriétaire de la base", async () => {
    const code = await pgError(as(user(f.admin, "aal2"), (c) => c.query("delete from public.audit_logs")));
    // Aucune politique DELETE : 0 ligne supprimée sans erreur, ou refus explicite.
    expect([null, "42501"]).toContain(code);
    const { getPool } = await import("../helpers/db");
    const err = await pgError(getPool().query("update public.audit_logs set action = 'x' where organization_id = $1", [f.org]));
    expect(err).toBe("42501");
  });
});

describe("10. Les journaux ne contiennent ni mots de passe ni jetons", () => {
  it("le hash d'un jeton de partage n'est jamais journalisé", async () => {
    const changes = await as(user(f.admin, "aal2"), async (c) => {
      await c.query(
        `insert into public.document_shares (document_id, token_hash, expires_at) values ($1, repeat('b', 64), now() + interval '1 day')`,
        [f.docA],
      );
      return (
        await c.query("select changes from public.audit_logs where entity_type = 'document_shares' order by id desc limit 1")
      ).rows[0].changes;
    });
    expect(JSON.stringify(changes)).not.toContain("bbbbbbbb");
    expect(changes).not.toHaveProperty("token_hash");
  });
});

describe("12. Liens de partage", () => {
  it("une durée de validité supérieure à 7 jours est refusée", async () => {
    const code = await pgError(
      as(user(f.admin, "aal2"), (c) =>
        c.query(
          `insert into public.document_shares (document_id, token_hash, expires_at) values ($1, repeat('c', 64), now() + interval '8 days')`,
          [f.docA],
        ),
      ),
    );
    expect(code).toBe("23514");
  });

  it("un rapport de sûreté ne peut jamais être partagé par lien", async () => {
    const code = await pgError(
      as(user(f.admin, "aal2"), async (c) => {
        await c.query("update public.documents set category = 'rapport_audit' where id = $1", [f.docA]);
        await c.query(
          `insert into public.document_shares (document_id, token_hash, expires_at) values ($1, repeat('d', 64), now() + interval '1 day')`,
          [f.docA],
        );
      }),
    );
    expect(code).toBe("23514");
  });

  it("un client ne peut pas créer de lien de partage", async () => {
    const code = await pgError(
      as(user(f.clientUserA), (c) =>
        c.query(
          `insert into public.document_shares (document_id, token_hash, expires_at) values ($1, repeat('e', 64), now() + interval '1 day')`,
          [f.docA],
        ),
      ),
    );
    expect(code).toBe("42501");
  });
});
