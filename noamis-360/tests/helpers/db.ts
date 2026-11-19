/**
 * Utilitaires de test base de données : exécute des requêtes « comme » un
 * utilisateur Supabase (rôle `authenticated` + claims JWT), exactement comme
 * PostgREST le fait en production. Chaque scénario est exécuté dans une
 * transaction annulée (ROLLBACK) pour garantir l'isolation des tests.
 *
 * Données exclusivement fictives.
 */
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";

export const DB_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let pool: Pool | null = null;
export function getPool(): Pool {
  pool ??= new Pool({ connectionString: DB_URL, max: 4 });
  return pool;
}
export async function closePool() {
  await pool?.end();
  pool = null;
}

export type Actor =
  | { kind: "anon" }
  | { kind: "service" }
  | { kind: "user"; id: string; aal?: "aal1" | "aal2" };

async function applyActor(client: PoolClient, actor: Actor) {
  if (actor.kind === "service") {
    await client.query("set local role service_role");
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "service_role" })]);
    return;
  }
  if (actor.kind === "anon") {
    await client.query("set local role anon");
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "anon" })]);
    return;
  }
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: actor.id, role: "authenticated", aal: actor.aal ?? "aal1" }),
  ]);
}

/** Exécute `fn` comme `actor` dans une transaction toujours annulée. */
export async function as<T>(actor: Actor, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    await applyActor(client, actor);
    return await fn(client);
  } finally {
    await client.query("rollback").catch(() => undefined);
    client.release();
  }
}

/** Exécute avec les droits du propriétaire (mise en place des données). */
export async function admin<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/** Code d'erreur Postgres levé par `promise` (ou null si succès). */
export async function pgError(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? "unknown";
  }
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;

/**
 * Crée une organisation fictive complète : super-admin, admin, deux
 * collaborateurs, deux clients (A et B) avec chacun un compte portail,
 * une mission confidentielle et des missions/documents par client.
 */
export async function createFixture() {
  const tag = randomUUID().slice(0, 8);
  const ids = {
    superAdmin: randomUUID(),
    admin: randomUUID(),
    collab: randomUUID(),
    collab2: randomUUID(),
    clientUserA: randomUUID(),
    clientUserB: randomUUID(),
    outsider: randomUUID(),
  };

  return admin(async (c) => {
    for (const [name, id] of Object.entries(ids)) {
      await c.query(
        `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
         values ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '', now(), now(), now(), '{}', $3)`,
        [id, `${name.toLowerCase()}-${tag}@exemple.test`, JSON.stringify({ full_name: `Test ${name}` })],
      );
    }
    const org = (
      await c.query(
        `insert into public.organizations (name, legal_name, siren, address_line, postal_code, city, vat_regime)
         values ($1, 'Organisation de test', '123456789', '1 rue Fictive', '75000', 'Paris', 'franchise') returning id`,
        [`Org test ${tag}`],
      )
    ).rows[0].id as string;
    const otherOrg = (
      await c.query(`insert into public.organizations (name) values ($1) returning id`, [`Autre org ${tag}`])
    ).rows[0].id as string;

    const mkClient = async (name: string) =>
      (
        await c.query(
          `insert into public.clients (organization_id, name, category, address_line, postal_code, city)
           values ($1, $2, 'entreprise', '2 avenue Fictive', '78100', 'Saint-Germain-en-Laye') returning id`,
          [org, name],
        )
      ).rows[0].id as string;
    const clientA = await mkClient(`Client A ${tag}`);
    const clientB = await mkClient(`Client B ${tag}`);

    const member = (user: string, role: string, client: string | null, o = org) =>
      c.query(`insert into public.memberships (organization_id, user_id, role, client_id) values ($1, $2, $3, $4)`, [
        o,
        user,
        role,
        client,
      ]);
    await member(ids.superAdmin, "super_admin", null);
    await member(ids.admin, "admin", null);
    await member(ids.collab, "collaborator", null);
    await member(ids.collab2, "collaborator", null);
    await member(ids.clientUserA, "client", clientA);
    await member(ids.clientUserB, "client", clientB);
    await member(ids.outsider, "collaborator", null, otherOrg);

    const mkMission = async (client: string, title: string, confidential = false, manager: string | null = null) =>
      (
        await c.query(
          `insert into public.missions (organization_id, client_id, service_type, title, is_confidential, manager_id, status)
           values ($1, $2, 'audit_surete', $3, $4, $5, 'en_cours') returning id`,
          [org, client, title, confidential, manager],
        )
      ).rows[0].id as string;
    const missionA = await mkMission(clientA, "Mission A");
    const missionB = await mkMission(clientB, "Mission B");
    const missionConfidential = await mkMission(clientA, "Mission confidentielle", true, ids.collab);

    const mkDoc = async (client: string, mission: string | null, visible: boolean, extra: Record<string, unknown> = {}) =>
      (
        await c.query(
          `insert into public.documents (organization_id, client_id, mission_id, title, category, confidentiality, client_visible, created_by)
           values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
          [
            org,
            client,
            mission,
            (extra.title as string) ?? "Document",
            (extra.category as string) ?? "livrable",
            visible ? "client" : ((extra.confidentiality as string) ?? "interne"),
            visible,
            ids.admin,
          ],
        )
      ).rows[0].id as string;
    const docA = await mkDoc(clientA, missionA, true, { title: "Livrable A" });
    const docAInternal = await mkDoc(clientA, missionA, false, { title: "Note interne A" });
    const docB = await mkDoc(clientB, missionB, true, { title: "Livrable B" });
    const docConfidential = await mkDoc(clientA, missionConfidential, false, { title: "Doc confidentiel" });

    return { tag, org, otherOrg, clientA, clientB, missionA, missionB, missionConfidential, docA, docAInternal, docB, docConfidential, ...ids };
  });
}
