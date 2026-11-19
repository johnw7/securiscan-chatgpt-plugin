"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { check, guarded } from "@/lib/actions";
import { logger } from "@/lib/logger";
import { FetchPolicyError, checkRobots, safeFetchText } from "@/lib/safe-fetch";
import { uuid } from "@/lib/validation/common";
import { aiConnectorStatus, draftSynthesis } from "./ai";
import { parseFeed } from "./feed";
import { aiDraftSchema, publishSchema, referenceSchema, reportSchema, sourceSchema } from "./schemas";

type Ref = z.infer<typeof referenceSchema>;

export async function saveSource(input: unknown) {
  return guarded("intelligence.manage", sourceSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) check(await supabase.from("intelligence_sources").update(values).eq("id", id).select("id").single());
    else check(await supabase.from("intelligence_sources").insert(values).select("id").single());
    revalidatePath("/intelligence");
    return { ok: true };
  });
}

/**
 * Collecte d'un flux autorisé : la source doit être marquée « collecte autorisée »,
 * disposer d'un flux HTTPS et robots.txt doit l'autoriser. Seuls titre, lien,
 * date et un court extrait sont conservés.
 */
export async function collectSource(sourceId: string) {
  return guarded("intelligence.manage", uuid, sourceId, async (id, { supabase }) => {
    const source = check(await supabase.from("intelligence_sources").select("*").eq("id", id).single());
    if (!source.collection_allowed || !source.is_active) return { ok: false, error: "Collecte non autorisée pour cette source (vérifiez ses conditions d'utilisation)." };
    if (!source.feed_url) return { ok: false, error: "Aucun flux RSS/Atom renseigné : la collecte automatique ne porte que sur des flux publiés." };
    try {
      if (!(await checkRobots(source.feed_url))) return { ok: false, error: "Le fichier robots.txt du site n'autorise pas cette collecte." };
      const { status, text } = await safeFetchText(source.feed_url, "application/rss+xml, application/atom+xml, application/xml, text/xml");
      if (status !== 200) return { ok: false, error: `Le flux a répondu avec le code ${status}.` };
      const entries = parseFeed(text);
      if (!entries.length) return { ok: false, error: "Aucune entrée exploitable dans ce flux." };
      const rows = entries.map((e) => ({ source_id: id, title: e.title, url: e.url, published_at: e.published_at, excerpt: e.excerpt, theme: source.themes[0] ?? null }));
      const { data, error } = await supabase.from("intelligence_items").upsert(rows, { onConflict: "source_id,url", ignoreDuplicates: true }).select("id");
      if (error) throw error;
      await supabase.from("intelligence_sources").update({ last_collected_at: new Date().toISOString() }).eq("id", id);
      revalidatePath("/intelligence");
      return { ok: true, message: `${data?.length ?? 0} nouveau(x) contenu(s) collecté(s)` };
    } catch (e) {
      if (e instanceof FetchPolicyError) return { ok: false, error: e.message };
      logger.warn("intelligence.collect_failed", { sourceId: id, error: e });
      return { ok: false, error: "Le flux n'a pas pu être récupéré (délai dépassé ou format invalide)." };
    }
  });
}

export async function setItemStatus(itemId: string, status: string) {
  return guarded("intelligence.manage", z.object({ id: uuid, status: z.enum(["nouveau", "retenu", "ecarte", "archive"]) }), { id: itemId, status }, async (d, { supabase }) => {
    check(await supabase.from("intelligence_items").update({ status: d.status }).eq("id", d.id).select("id").single());
    return { ok: true };
  });
}

export async function setItemCredibility(itemId: string, credibility: string) {
  return guarded("intelligence.manage", z.object({ id: uuid, c: z.coerce.number().int().min(1).max(6) }), { id: itemId, c: credibility }, async (d, { supabase }) => {
    check(await supabase.from("intelligence_items").update({ credibility: d.c }).eq("id", d.id).select("id").single());
    return { ok: true };
  });
}

/** Références des contenus retenus (titre, URL, date, source, fiabilité). */
async function retainedReferences(supabase: Parameters<Parameters<typeof guarded>[3]>[1]["supabase"]) {
  const { data } = await supabase
    .from("intelligence_items")
    .select("id, title, url, published_at, collected_at, excerpt, credibility, intelligence_sources(name, reliability)")
    .eq("status", "retenu")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(25);
  return (data ?? []).map((i) => {
    const src = i.intelligence_sources as { name: string; reliability: string } | null;
    return {
      id: i.id,
      ref: {
        title: i.title, url: i.url, date: (i.published_at ?? i.collected_at).slice(0, 10), source: src?.name ?? "—",
        reliability: (src?.reliability ?? "F") as Ref["reliability"], credibility: i.credibility ?? 6,
      } satisfies Ref,
      excerpt: i.excerpt,
    };
  });
}

export async function saveReport(input: unknown) {
  return guarded("intelligence.manage", reportSchema, input, async ({ id, ...values }, { supabase }) => {
    const row = id
      ? check(await supabase.from("intelligence_reports").update(values).eq("id", id).select("id").single())
      : check(await supabase.from("intelligence_reports").insert(values).select("id").single());
    revalidatePath("/intelligence");
    return { ok: true, data: { id: row.id } };
  });
}

/** Crée une fiche brouillon rattachant les références des contenus retenus. */
export async function createReportFromRetained(input: unknown) {
  return guarded("intelligence.manage", aiDraftSchema, input, async ({ topic }, { supabase }) => {
    const refs = await retainedReferences(supabase);
    if (!refs.length) return { ok: false, error: "Retenez d'abord au moins un contenu collecté." };
    const row = check(
      await supabase
        .from("intelligence_reports")
        .insert({ kind: "fiche", title: topic, source_refs: refs.map((r) => r.ref), body: refs.map((r, i) => `[${i + 1}] ${r.ref.title} — ${r.ref.source}`).join("\n") })
        .select("id")
        .single(),
    );
    await supabase.from("intelligence_items").update({ status: "archive" }).in("id", refs.map((r) => r.id));
    revalidatePath("/intelligence");
    return { ok: true, data: { id: row.id }, message: "Fiche brouillon créée" };
  });
}

/** Brouillon d'analyse généré par IA (identifié comme tel, validation humaine obligatoire). */
export async function createAiDraft(input: unknown) {
  return guarded("intelligence.manage", aiDraftSchema, input, async ({ topic }, { supabase }) => {
    if (!aiConnectorStatus().enabled) return { ok: false, error: "Connecteur IA non configuré (clé ANTHROPIC_API_KEY absente)." };
    const refs = await retainedReferences(supabase);
    if (!refs.length) return { ok: false, error: "Retenez d'abord au moins un contenu collecté." };
    try {
      const draft = await draftSynthesis(topic, refs.map((r) => ({ ...r.ref, excerpt: r.excerpt })));
      const row = check(
        await supabase
          .from("intelligence_reports")
          .insert({
            kind: "fiche", title: topic, ai_generated: true, status: "brouillon", source_refs: refs.map((r) => r.ref),
            summary: "Brouillon généré par IA — à vérifier et valider par un analyste avant toute diffusion.",
            body: draft.text,
          })
          .select("id")
          .single(),
      );
      await supabase.from("intelligence_items").update({ status: "archive" }).in("id", refs.map((r) => r.id));
      revalidatePath("/intelligence");
      return { ok: true, data: { id: row.id }, message: "Brouillon IA créé : relecture et validation requises" };
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      logger.warn("intelligence.ai_failed", { code });
      return { ok: false, error: code === "AI_REFUSED" ? "Le modèle a décliné cette demande." : "La génération du brouillon a échoué." };
    }
  });
}

export async function addReference(reportId: string, input: unknown) {
  return guarded("intelligence.manage", referenceSchema, input, async (ref, { supabase }) => {
    const report = check(await supabase.from("intelligence_reports").select("source_refs").eq("id", reportId).single());
    const refs = Array.isArray(report.source_refs) ? report.source_refs : [];
    check(await supabase.from("intelligence_reports").update({ source_refs: [...refs, ref] }).eq("id", reportId).select("id").single());
    revalidatePath(`/intelligence/reports/${reportId}`);
    return { ok: true, message: "Référence ajoutée" };
  });
}

export async function removeReference(reportId: string, index: number) {
  return guarded("intelligence.manage", z.number().int().min(0).max(500), index, async (i, { supabase }) => {
    const report = check(await supabase.from("intelligence_reports").select("source_refs").eq("id", reportId).single());
    const refs = Array.isArray(report.source_refs) ? [...report.source_refs] : [];
    refs.splice(i, 1);
    check(await supabase.from("intelligence_reports").update({ source_refs: refs }).eq("id", reportId).select("id").single());
    revalidatePath(`/intelligence/reports/${reportId}`);
    return { ok: true, message: "Référence retirée" };
  });
}

export async function submitForReview(reportId: string) {
  return guarded("intelligence.manage", uuid, reportId, async (id, { supabase }) => {
    check(await supabase.from("intelligence_reports").update({ status: "en_revue" }).eq("id", id).eq("status", "brouillon").select("id").single());
    revalidatePath(`/intelligence/reports/${id}`);
    return { ok: true, message: "Transmis en revue" };
  });
}

/** Validation humaine : condition préalable obligatoire à toute diffusion. */
export async function validateReport(reportId: string) {
  return guarded("intelligence.publish", uuid, reportId, async (id, { supabase, session }) => {
    const report = check(await supabase.from("intelligence_reports").select("source_refs, status").eq("id", id).single());
    if (!Array.isArray(report.source_refs) || !report.source_refs.length) {
      return { ok: false, error: "Une synthèse doit conserver au moins une référence datée avant validation." };
    }
    check(
      await supabase
        .from("intelligence_reports")
        .update({ status: "valide", validated_by: session.userId, validated_at: new Date().toISOString() })
        .eq("id", id)
        .in("status", ["brouillon", "en_revue"])
        .select("id")
        .single(),
    );
    revalidatePath(`/intelligence/reports/${id}`);
    return { ok: true, message: "Rapport validé" };
  });
}

export async function publishReport(reportId: string, input: unknown) {
  return guarded("intelligence.publish", publishSchema, input, async ({ client_ids }, { supabase }) => {
    const { error } = await supabase.rpc("publish_intelligence_report", { p_report: reportId, p_clients: client_ids });
    if (error) throw error;
    revalidatePath(`/intelligence/reports/${reportId}`);
    return { ok: true, message: `Diffusé à ${client_ids.length} client(s)` };
  });
}

export async function archiveReport(reportId: string) {
  return guarded("intelligence.manage", uuid, reportId, async (id, { supabase }) => {
    check(await supabase.from("intelligence_reports").update({ status: "archive" }).eq("id", id).select("id").single());
    revalidatePath("/intelligence");
    return { ok: true, message: "Rapport archivé" };
  });
}
