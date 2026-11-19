"use server";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { check, guarded } from "@/lib/actions";
import { logger } from "@/lib/logger";
import { renderPdf } from "@/lib/pdf/base";
import { uuid } from "@/lib/validation/common";
import { storeDocumentVersion } from "@/features/docs/storage";
import { FinanceDocumentPdf, loadFinanceDocument } from "./pdf";
import { catalogSchema, invoiceSchema, lineSchema, paymentSchema, quoteSchema, reminderSchema } from "./schemas";

// ------------------------------------------------------------- Catalogue
export async function saveCatalogItem(input: unknown) {
  return guarded("finance.catalog.manage", catalogSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) check(await supabase.from("service_catalog").update(values).eq("id", id).select("id").single());
    else check(await supabase.from("service_catalog").insert(values).select("id").single());
    revalidatePath("/finance/catalog");
    return { ok: true };
  });
}

// ------------------------------------------------------------- Devis
export async function saveQuote(input: unknown) {
  return guarded("finance.draft", quoteSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) {
      check(await supabase.from("quotes").update(values).eq("id", id).eq("status", "brouillon").select("id").single());
      revalidatePath(`/finance/quotes/${id}`);
      return { ok: true, data: { id } };
    }
    const row = check(await supabase.from("quotes").insert(values).select("id").single());
    revalidatePath("/finance/quotes");
    return { ok: true, data: { id: row.id } };
  });
}

export async function saveQuoteLine(quoteId: string, input: unknown) {
  return guarded("finance.draft", lineSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) check(await supabase.from("quote_items").update(values).eq("id", id).eq("quote_id", quoteId).select("id").single());
    else check(await supabase.from("quote_items").insert({ ...values, quote_id: quoteId }).select("id").single());
    revalidatePath(`/finance/quotes/${quoteId}`);
    return { ok: true };
  });
}

export async function deleteQuoteLine(quoteId: string, lineId: string) {
  return guarded("finance.draft", uuid, lineId, async (id, { supabase }) => {
    const { error } = await supabase.from("quote_items").delete().eq("id", id).eq("quote_id", quoteId);
    if (error) throw error;
    revalidatePath(`/finance/quotes/${quoteId}`);
    return { ok: true, message: "Ligne supprimée" };
  });
}

export async function sendQuote(quoteId: string) {
  return guarded("finance.draft", uuid, quoteId, async (id, { supabase }) => {
    const q = check(await supabase.from("quotes").select("status, total_ttc, quote_items(count)").eq("id", id).single());
    if (q.status !== "brouillon") return { ok: false, error: "Seul un brouillon peut être envoyé." };
    if (!((q.quote_items as unknown as Array<{ count: number }>)[0]?.count ?? 0)) return { ok: false, error: "Le devis ne comporte aucune ligne." };
    check(await supabase.from("quotes").update({ status: "envoye", sent_at: new Date().toISOString() }).eq("id", id).select("id").single());
    revalidatePath(`/finance/quotes/${id}`);
    return { ok: true, message: "Devis marqué comme envoyé : il est visible dans le portail du client" };
  });
}

/** Réponse enregistrée par NOAMIS (ex. bon pour accord signé hors portail). */
export async function setQuoteOutcome(quoteId: string, outcome: string) {
  return guarded("finance.draft", z.object({ id: uuid, outcome: z.enum(["accepte", "refuse", "expire"]) }), { id: quoteId, outcome }, async (d, { supabase }) => {
    check(await supabase.from("quotes").update({ status: d.outcome, responded_at: new Date().toISOString() }).eq("id", d.id).eq("status", "envoye").select("id").single());
    revalidatePath(`/finance/quotes/${d.id}`);
    return { ok: true };
  });
}

export async function convertQuote(quoteId: string) {
  return guarded("finance.draft", uuid, quoteId, async (id, { supabase }) => {
    const { data, error } = await supabase.rpc("convert_quote_to_invoice", { p_quote: id });
    if (error) throw error;
    revalidatePath(`/finance/quotes/${id}`);
    return { ok: true, data: { id: data as string }, message: "Facture brouillon créée" };
  });
}

export async function deleteQuote(quoteId: string) {
  return guarded("finance.issue", uuid, quoteId, async (id, { supabase }) => {
    const { count, error } = await supabase.from("quotes").delete({ count: "exact" }).eq("id", id).eq("status", "brouillon");
    if (error) throw error;
    if (!count) return { ok: false, error: "Seul un brouillon peut être supprimé." };
    revalidatePath("/finance/quotes");
    return { ok: true, message: "Brouillon supprimé" };
  });
}

// ------------------------------------------------------------- Factures
export async function saveInvoice(input: unknown) {
  return guarded("finance.draft", invoiceSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) {
      check(await supabase.from("invoices").update(values).eq("id", id).eq("status", "brouillon").select("id").single());
      revalidatePath(`/finance/invoices/${id}`);
      return { ok: true, data: { id } };
    }
    const row = check(await supabase.from("invoices").insert(values).select("id").single());
    revalidatePath("/finance/invoices");
    return { ok: true, data: { id: row.id } };
  });
}

export async function saveInvoiceLine(invoiceId: string, input: unknown) {
  return guarded("finance.draft", lineSchema, input, async ({ id, ...values }, { supabase }) => {
    const inv = check(await supabase.from("invoices").select("kind").eq("id", invoiceId).single());
    // Les lignes d'un avoir sont en quantités négatives.
    const quantity = inv.kind === "avoir" ? -Math.abs(values.quantity) : values.quantity;
    if (id) check(await supabase.from("invoice_items").update({ ...values, quantity }).eq("id", id).eq("invoice_id", invoiceId).select("id").single());
    else check(await supabase.from("invoice_items").insert({ ...values, quantity, invoice_id: invoiceId }).select("id").single());
    revalidatePath(`/finance/invoices/${invoiceId}`);
    return { ok: true };
  });
}

export async function deleteInvoiceLine(invoiceId: string, lineId: string) {
  return guarded("finance.draft", uuid, lineId, async (id, { supabase }) => {
    const { error } = await supabase.from("invoice_items").delete().eq("id", id).eq("invoice_id", invoiceId);
    if (error) throw error;
    revalidatePath(`/finance/invoices/${invoiceId}`);
    return { ok: true, message: "Ligne supprimée" };
  });
}

export async function deleteInvoiceDraft(invoiceId: string) {
  return guarded("finance.draft", uuid, invoiceId, async (id, { supabase }) => {
    check(await supabase.from("invoices").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("status", "brouillon").select("id").single());
    revalidatePath("/finance/invoices");
    return { ok: true, message: "Brouillon supprimé" };
  });
}

/**
 * Émission (administrateur, MFA) : numérotation définitive, verrouillage, puis
 * archivage du PDF émis (empreinte SHA-256) dans l'espace documentaire du client.
 */
export async function issueInvoice(invoiceId: string) {
  return guarded("finance.issue", uuid, invoiceId, async (id, { supabase }) => {
    const { data: number, error } = await supabase.rpc("issue_invoice", { p_invoice: id });
    if (error) throw error;
    try {
      const doc = await loadFinanceDocument(supabase, "invoice", id);
      if (doc) {
        const bytes = new Uint8Array(await renderPdf(createElement(FinanceDocumentPdf, { data: doc })));
        await storeDocumentVersion(
          supabase,
          {
            create: {
              title: `${doc.kind === "avoir" ? "Avoir" : "Facture"} ${number}`, category: "facture", client_id: doc.client_id, mission_id: doc.mission_id,
              confidentiality: "client", client_visible: true, tags: ["facture", String(number)],
            },
          },
          { bytes, fileName: `${number}.pdf`, mime: "application/pdf", ext: "pdf", sha256: createHash("sha256").update(bytes).digest("hex"), comment: "Exemplaire émis (archivé)" },
        );
      }
    } catch (e) {
      logger.error("finance.archive_pdf_failed", { invoiceId: id, error: e });
    }
    revalidatePath(`/finance/invoices/${id}`);
    return { ok: true, message: `Document émis sous le numéro ${number}` };
  });
}

export async function createCreditNote(invoiceId: string) {
  return guarded("finance.issue", uuid, invoiceId, async (id, { supabase }) => {
    const { data, error } = await supabase.rpc("create_credit_note", { p_invoice: id });
    if (error) throw error;
    return { ok: true, data: { id: data as string }, message: "Avoir brouillon créé : vérifiez-le puis émettez-le" };
  });
}

export async function recordPayment(invoiceId: string, input: unknown) {
  return guarded("finance.payments", paymentSchema, input, async (values, { supabase }) => {
    check(await supabase.from("payments").insert({ ...values, invoice_id: invoiceId }).select("id").single());
    revalidatePath(`/finance/invoices/${invoiceId}`);
    return { ok: true, message: "Règlement enregistré" };
  });
}

export async function deletePayment(invoiceId: string, paymentId: string) {
  return guarded("finance.payments", uuid, paymentId, async (id, { supabase }) => {
    const { error } = await supabase.from("payments").delete().eq("id", id).eq("invoice_id", invoiceId);
    if (error) throw error;
    revalidatePath(`/finance/invoices/${invoiceId}`);
    return { ok: true, message: "Règlement annulé (opération journalisée)" };
  });
}

export async function addReminder(invoiceId: string, input: unknown) {
  return guarded("finance.view", reminderSchema, input, async (values, { supabase }) => {
    check(await supabase.from("payment_reminders").insert({ ...values, invoice_id: invoiceId }).select("id").single());
    revalidatePath(`/finance/invoices/${invoiceId}`);
    return { ok: true, message: "Relance consignée" };
  });
}

/** Ajoute une ligne reprenant une prestation du catalogue. */
export async function addCatalogLine(target: "quote" | "invoice", documentId: string, itemId: string) {
  return guarded("finance.draft", z.object({ t: z.enum(["quote", "invoice"]), d: uuid, i: uuid }), { t: target, d: documentId, i: itemId }, async ({ t, d, i }, { supabase }) => {
    const item = check(await supabase.from("service_catalog").select("*").eq("id", i).single());
    const line = {
      catalog_item_id: item.id, description: item.description ? `${item.name}\n${item.description}` : item.name, quantity: 1, unit: item.unit,
      unit_price: item.unit_price, vat_rate: item.vat_rate, discount_rate: 0, position: 999,
    };
    if (t === "quote") check(await supabase.from("quote_items").insert({ ...line, quote_id: d }).select("id").single());
    else check(await supabase.from("invoice_items").insert({ ...line, invoice_id: d }).select("id").single());
    revalidatePath(`/finance/${t === "quote" ? "quotes" : "invoices"}/${d}`);
    return { ok: true };
  });
}
