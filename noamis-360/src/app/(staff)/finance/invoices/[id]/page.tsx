import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BellRing, FileDown, Lock, Pencil, Plus, Stamp, Trash2, Undo2 } from "lucide-react";
import { HistoryTimeline } from "@/components/shared/history";
import { ActionButton } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { DefinitionList, Notice, PageHeader } from "@/components/ui/misc";
import {
  addCatalogLine, addReminder, createCreditNote, deleteInvoiceDraft, deleteInvoiceLine, deletePayment, issueInvoice, recordPayment, saveInvoice, saveInvoiceLine,
} from "@/features/finance/actions";
import { amountDue, isOverdue } from "@/features/finance/calc";
import { invoiceFields, paymentFields, reminderFields } from "@/features/finance/fields";
import { LinesCard } from "@/features/finance/lines";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { INVOICE_STATUS, PAYMENT_METHODS, labelOf } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, formatEUR, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Facture" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("finance.view");
  const { id } = await params;
  const supabase = await createClient();
  const { data: v } = await supabase.from("invoices").select("*, clients(id, name), invoice_items(*), credited:credited_invoice_id(id, number)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!v) notFound();
  const [{ data: payments }, { data: reminders }, { data: credits }, { data: catalog }, clients, missions] = await Promise.all([
    supabase.from("payments").select("*").eq("invoice_id", id).order("paid_at"),
    supabase.from("payment_reminders").select("*").eq("invoice_id", id).order("sent_at"),
    supabase.from("invoices").select("id, number, status, total_ttc").eq("credited_invoice_id", id),
    supabase.from("service_catalog").select("id, code, name").eq("is_active", true).order("code"),
    getClientOptions(),
    getMissionOptions(),
  ]);
  const draft = v.status === "brouillon";
  const isCredit = v.kind === "avoir";
  const client = v.clients as { id: string; name: string } | null;
  const today = todayISO();
  const due = Number(amountDue(v));
  const lines = [...(v.invoice_items ?? [])].sort((a, b) => a.position - b.position).map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price), discount_rate: Number(l.discount_rate), vat_rate: Number(l.vat_rate), total_ht: Number(l.total_ht) }));
  const credited = (v.credited as unknown as Array<{ id: string; number: string | null }> | { id: string; number: string | null } | null) ?? null;
  const creditedRef = Array.isArray(credited) ? credited[0] : credited;
  return (
    <>
      <PageHeader
        eyebrow={`NOAMIS FINANCE · ${isCredit ? "Avoir" : "Facture"} ${v.number ?? "brouillon"}`}
        title={v.title}
        description={client ? <>Client : <Link className="text-gold-text hover:underline" href={`/pilot/clients/${client.id}`}>{client.name}</Link>{v.issue_date ? <> · émise le {formatDate(v.issue_date)}</> : null}{v.due_date && !isCredit ? <> · échéance {formatDate(v.due_date)}</> : null}</> : undefined}
        actions={
          <>
            {!draft && <Badge tone="neutral"><Lock className="size-3" /> Verrouillée</Badge>}
            <StatusBadge map={INVOICE_STATUS} value={v.status} />
            <Button asChild variant="outline"><a href={`/api/pdf/invoice/${v.id}`}><FileDown /> PDF</a></Button>
            {draft && <FormDialog title="Modifier" size="lg" trigger={<Button variant="secondary"><Pencil /> Modifier</Button>} schema="invoice" fields={invoiceFields(clients, missions)} defaultValues={v} hidden={{ id: v.id }} action={saveInvoice} />}
            {draft && can(session.role, "finance.issue") && (
              <ActionButton
                action={issueInvoice.bind(null, v.id)}
                confirm={{ title: `Émettre ${isCredit ? "l'avoir" : "la facture"} ?`, description: "Un numéro définitif sera attribué, les informations vendeur/client seront figées et le document ne pourra plus être modifié (correction uniquement par avoir). Le PDF émis est archivé et partagé avec le client.", confirmLabel: "Émettre" }}
              >
                <Stamp /> Émettre
              </ActionButton>
            )}
            {draft && <ActionButton variant="ghost" action={deleteInvoiceDraft.bind(null, v.id)} redirectTo="/finance/invoices" confirm={{ title: "Supprimer ce brouillon ?", description: "Aucun numéro n'a encore été attribué.", danger: true, confirmLabel: "Supprimer" }}><Trash2 /></ActionButton>}
            {!draft && !isCredit && v.status !== "annulee" && can(session.role, "finance.issue") && (
              <ActionButton variant="ghost" action={createCreditNote.bind(null, v.id)} redirectTo="/finance/invoices/:id" confirm={{ title: "Créer un avoir ?", description: "Un avoir brouillon reprenant les lignes de la facture sera créé ; ajustez-le puis émettez-le.", confirmLabel: "Créer l'avoir" }}><Undo2 /> Avoir</ActionButton>
            )}
          </>
        }
      />
      {draft && !can(session.role, "finance.issue") && <div className="mb-6"><Notice tone="info">Brouillon préparé par l&apos;équipe : l&apos;émission est réservée aux administrateurs.</Notice></div>}
      {creditedRef && <div className="mb-6"><Notice tone="info">Avoir sur la facture <Link className="underline" href={`/finance/invoices/${creditedRef.id}`}>{creditedRef.number}</Link>.</Notice></div>}
      {!isCredit && isOverdue(v, today) && <div className="mb-6"><Notice tone="danger" title="Facture en retard">Échue depuis le {formatDate(v.due_date)} — reste dû {formatEUR(due)}.</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LinesCard
            lines={lines}
            totals={{ subtotal_ht: Number(v.subtotal_ht), discount_amount: Number(v.discount_amount), total_ht: Number(v.total_ht), total_vat: Number(v.total_vat), total_ttc: Number(v.total_ttc), discount_rate: Number(v.discount_rate), vat_breakdown: (v.vat_breakdown ?? []) as Array<{ rate: number; base: string; vat: string }> }}
            editable={draft}
            catalog={isCredit ? [] : (catalog ?? []).map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
            saveAction={saveInvoiceLine.bind(null, v.id)}
            deleteAction={deleteInvoiceLine.bind(null, v.id)}
            addFromCatalog={isCredit ? undefined : addCatalogLine.bind(null, "invoice", v.id)}
            negate={isCredit}
          />
        </div>
        <div className="space-y-6">
          {!isCredit && !draft && (
            <Card>
              <CardHeader
                title="Règlements"
                as="h3"
                action={can(session.role, "finance.payments") && due > 0 && <FormDialog title="Enregistrer un règlement" trigger={<Button size="sm"><Plus /> Règlement</Button>} schema="payment" fields={paymentFields} defaultValues={{ amount: due.toFixed(2), paid_at: today, method: "virement" }} action={recordPayment.bind(null, v.id)} />}
              />
              <CardBody className="space-y-3 text-sm">
                <DefinitionList items={[{ label: "Total TTC", value: formatEUR(v.total_ttc) }, { label: "Réglé", value: formatEUR(v.amount_paid) }, { label: "Avoirs imputés", value: formatEUR(v.amount_credited) }, { label: "Reste dû", value: <strong>{formatEUR(due)}</strong> }]} />
                <ul className="divide-y divide-border border-t border-border">
                  {(payments ?? []).map((p) => (
                    <li key={p.id} className="flex items-center gap-2 py-2">
                      <span className="flex-1">{formatDate(p.paid_at)} · {labelOf(PAYMENT_METHODS, p.method)}{p.reference ? ` · ${p.reference}` : ""}</span>
                      <span className="tabular-nums">{formatEUR(p.amount)}</span>
                      {can(session.role, "finance.payments") && <ActionButton variant="ghost" size="icon-sm" aria-label="Annuler ce règlement" action={deletePayment.bind(null, v.id, p.id)} confirm={{ title: "Annuler ce règlement ?", description: "L'opération est journalisée.", danger: true, confirmLabel: "Annuler le règlement" }}><Trash2 /></ActionButton>}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          {!isCredit && !draft && (
            <Card>
              <CardHeader title="Relances" as="h3" action={due > 0 && <FormDialog title="Consigner une relance" trigger={<Button size="sm" variant="secondary"><BellRing /> Relance</Button>} schema="reminder" fields={reminderFields} defaultValues={{ level: String(Math.min(3, (reminders?.length ?? 0) + 1)), channel: "email" }} action={addReminder.bind(null, v.id)} />} />
              <CardBody>
                {reminders?.length ? (
                  <ul className="space-y-2 text-sm">{reminders.map((r) => <li key={r.id}>Niveau {r.level} · {r.channel} · {formatDateTime(r.sent_at)}{r.notes ? <span className="block text-xs text-muted">{r.notes}</span> : null}</li>)}</ul>
                ) : <p className="text-sm text-muted">Aucune relance.</p>}
              </CardBody>
            </Card>
          )}
          {!!credits?.length && (
            <Card>
              <CardHeader title="Avoirs liés" as="h3" />
              <CardBody><ul className="space-y-1 text-sm">{credits.map((c) => <li key={c.id}><Link className="text-gold-text hover:underline" href={`/finance/invoices/${c.id}`}>{c.number ?? "Avoir brouillon"}</Link> · {formatEUR(c.total_ttc)}</li>)}</ul></CardBody>
            </Card>
          )}
          <Card><CardHeader title="Historique" as="h3" /><CardBody><HistoryTimeline session={session} entityType="invoices" entityId={v.id} /></CardBody></Card>
        </div>
      </div>
    </>
  );
}
