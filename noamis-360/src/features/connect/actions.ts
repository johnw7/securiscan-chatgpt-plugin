"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { check, guarded } from "@/lib/actions";
import { uuid } from "@/lib/validation/common";
import { approvalSchema, clientMessageSchema, messageSchema, responseSchema } from "./schemas";

// ---------------------------------------------------------------- Personnel NOAMIS
export async function sendStaffMessage(input: unknown) {
  return guarded("connect.manage", messageSchema, input, async (values, { supabase }) => {
    check(await supabase.from("messages").insert({ ...values }).select("id").single());
    revalidatePath("/connect/messages");
    return { ok: true, message: "Message envoyé" };
  });
}

export async function markClientThreadRead(clientId: string) {
  return guarded("connect.manage", uuid, clientId, async (id, { supabase }) => {
    const { error } = await supabase.rpc("mark_messages_read", { p_client: id });
    if (error) throw error;
    return { ok: true };
  });
}

export async function requestApproval(input: unknown) {
  return guarded("connect.manage", approvalSchema, input, async (values, { supabase }) => {
    check(await supabase.from("client_approvals").insert(values).select("id").single());
    revalidatePath("/connect");
    return { ok: true, message: "Demande de validation envoyée au client" };
  });
}

// ---------------------------------------------------------------- Client (portail)
export async function sendClientMessage(input: unknown) {
  return guarded("portal.access", clientMessageSchema, input, async (values, { supabase, session }) => {
    if (!session.clientId) return { ok: false, error: "Compte client non rattaché." };
    check(await supabase.from("messages").insert({ ...values, client_id: session.clientId }).select("id").single());
    revalidatePath("/portal/messages");
    return { ok: true, message: "Message envoyé à NOAMIS" };
  });
}

export async function markMyThreadRead() {
  return guarded("portal.access", z.undefined(), undefined, async (_d, { supabase, session }) => {
    if (!session.clientId) return { ok: false, error: "Compte client non rattaché." };
    const { error } = await supabase.rpc("mark_messages_read", { p_client: session.clientId });
    if (error) throw error;
    return { ok: true };
  });
}

export async function respondApproval(approvalId: string, input: unknown) {
  return guarded("portal.access", responseSchema, input, async ({ accept, comment }, { supabase }) => {
    const { error } = await supabase.rpc("client_respond_approval", { p_approval: approvalId, p_approve: accept, p_comment: comment ?? "" });
    if (error) throw error;
    revalidatePath("/portal/approvals");
    return { ok: true, message: accept ? "Validation enregistrée" : "Refus enregistré" };
  });
}

export async function respondQuote(quoteId: string, input: unknown) {
  return guarded("portal.access", responseSchema, input, async ({ accept, comment }, { supabase }) => {
    const { error } = await supabase.rpc("client_respond_quote", { p_quote: quoteId, p_accept: accept, p_comment: comment ?? "" });
    if (error) throw error;
    revalidatePath("/portal/finance");
    return { ok: true, message: accept ? "Devis accepté — NOAMIS en est informé" : "Devis refusé — NOAMIS en est informé" };
  });
}

export async function markMyNotificationsRead() {
  return guarded("portal.access", z.undefined(), undefined, async (_d, { supabase, session }) => {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", session.userId).is("read_at", null);
    if (error) throw error;
    return { ok: true, message: "Notifications marquées comme lues" };
  });
}
