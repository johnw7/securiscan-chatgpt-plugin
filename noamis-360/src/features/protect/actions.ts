"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { toUserMessage } from "@/lib/errors";
import { serverEnv } from "@/lib/env.server";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreProtect, type ProtectResult } from "./questionnaire";
import { contactSchema, protectSchema } from "./schemas";
import { z } from "zod";

/**
 * Enregistrement d'un diagnostic public. Le score est recalculé côté serveur
 * (jamais celui du navigateur). L'adresse IP n'est conservée que sous forme
 * d'empreinte salée, pour limiter les abus (10 envois par heure).
 */
export async function submitProtect(input: unknown): Promise<{ ok: true; result: ProtectResult; id: string } | { ok: false; error: string }> {
  const parsed = protectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { audience, answers, department, contact } = parsed.data;
  const result = scoreProtect(audience, answers);
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0]!.trim();
  const ipHash = createHash("sha256").update(`${serverEnv().IP_HASH_SALT}:${ip || "inconnue"}`).digest("hex");
  const { data, error } = await createAdminClient().rpc("submit_protect_assessment", {
    p_audience: audience,
    p_answers: answers,
    p_score: result.score,
    p_level: result.level,
    p_department: department ?? "",
    p_ip_hash: ipHash,
    p_contact: contact ?? undefined,
  });
  if (error) {
    logger.warn("protect.submit_failed", { code: error.code });
    return { ok: false, error: toUserMessage(error) };
  }
  return { ok: true, result, id: data as string };
}

/** Demande de contact (consentement explicite) rattachée au diagnostic qui vient d'être réalisé. */
export async function attachProtectContact(assessmentId: unknown, contact: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = z.string().uuid().safeParse(assessmentId);
  const parsed = contactSchema.safeParse(contact);
  if (!id.success) return { ok: false, error: "Diagnostic introuvable" };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { error } = await createAdminClient().rpc("attach_protect_contact", { p_assessment: id.data, p_contact: parsed.data });
  if (error) {
    logger.warn("protect.contact_failed", { code: error.code });
    return { ok: false, error: toUserMessage(error) };
  }
  return { ok: true };
}
