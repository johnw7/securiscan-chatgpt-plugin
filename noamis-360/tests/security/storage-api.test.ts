/**
 * 5. Les téléchargements privés exigent une autorisation — tests contre
 * l'API Supabase réelle (Auth + Storage + PostgREST), avec de vrais jetons.
 */
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, closePool } from "../helpers/db";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PASSWORD = `Test-${randomUUID()}-Aa1`;

let service: SupabaseClient;
let clientA: SupabaseClient;
let anon: SupabaseClient;
let path: string;
let docB: string;

beforeAll(async () => {
  service = createClient(URL, SERVICE, { auth: { persistSession: false } });
  anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const tag = randomUUID().slice(0, 8);
  const email = `storage-${tag}@exemple.test`;
  const { data: u, error } = await service.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw error;
  const ids = await admin(async (c) => {
    const org = (await c.query("insert into public.organizations (name) values ($1) returning id", [`Org stockage ${tag}`])).rows[0].id;
    const a = (await c.query("insert into public.clients (organization_id, name) values ($1, 'Client A stockage') returning id", [org])).rows[0].id;
    const b = (await c.query("insert into public.clients (organization_id, name) values ($1, 'Client B stockage') returning id", [org])).rows[0].id;
    await c.query("insert into public.memberships (organization_id, user_id, role, client_id) values ($1, $2, 'client', $3)", [org, u.user!.id, a]);
    const d = (await c.query("insert into public.documents (organization_id, client_id, title, confidentiality, client_visible) values ($1, $2, 'Rapport B', 'client', true) returning id", [org, b])).rows[0].id;
    return { org, d };
  });
  docB = ids.d;
  path = `${ids.org}/documents/${docB}/${randomUUID()}.pdf`;
  const up = await service.storage.from("documents").upload(path, new Blob(["%PDF-1.4 confidentiel B"], { type: "application/pdf" }));
  if (up.error) throw up.error;
  await admin((c) =>
    c.query("insert into public.document_versions (document_id, storage_path, file_name, mime_type, size_bytes, sha256) values ($1, $2, 'b.pdf', 'application/pdf', 23, repeat('0', 64))", [docB, path]),
  );
  clientA = createClient(URL, ANON, { auth: { persistSession: false } });
  const signIn = await clientA.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw signIn.error;
});

afterAll(async () => {
  await service.storage.from("documents").remove([path]);
  await closePool();
});

describe("5. Accès direct au stockage privé", () => {
  it("le bucket des documents n'est pas public", async () => {
    const { data } = await service.storage.getBucket("documents");
    expect(data?.public).toBe(false);
    const { data: photos } = await service.storage.getBucket("audit-photos");
    expect(photos?.public).toBe(false);
  });

  it("un visiteur anonyme ne peut ni télécharger ni lister", async () => {
    expect((await anon.storage.from("documents").download(path)).data).toBeNull();
    const list = await anon.storage.from("documents").list();
    expect(list.data ?? []).toHaveLength(0);
  });

  it("l'URL publique d'un objet privé ne donne rien", async () => {
    const res = await fetch(anon.storage.from("documents").getPublicUrl(path).data.publicUrl);
    expect(res.ok).toBe(false);
  });

  it("un client authentifié ne peut pas télécharger directement un fichier (même connu)", async () => {
    expect((await clientA.storage.from("documents").download(path)).data).toBeNull();
    expect((await clientA.storage.from("documents").createSignedUrl(path, 60)).data).toBeNull();
  });

  it("un client authentifié ne peut pas déposer dans le bucket", async () => {
    const r = await clientA.storage.from("documents").upload(`x/${randomUUID()}.pdf`, new Blob(["%PDF-1.4"], { type: "application/pdf" }));
    expect(r.error).not.toBeNull();
  });

  it("via l'API REST, le client A ne voit ni le document ni les versions du client B", async () => {
    expect((await clientA.from("documents").select("id").eq("id", docB)).data).toEqual([]);
    expect((await clientA.from("document_versions").select("storage_path").eq("document_id", docB)).data).toEqual([]);
  });

  it("un jeton falsifié est rejeté", async () => {
    const forged = createClient(URL, ANON, { global: { headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.invalid" } }, auth: { persistSession: false } });
    const { data, error } = await forged.from("clients").select("id");
    expect(data ?? []).toHaveLength(0);
    expect(error).not.toBeNull();
  });
});
