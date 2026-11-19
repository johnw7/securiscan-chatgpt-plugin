import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileDown, Pencil, Receipt, Send, Trash2, XCircle } from "lucide-react";
import { HistoryTimeline } from "@/components/shared/history";
import { ActionButton } from "@/components/ui/action-button";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { DefinitionList, Notice, PageHeader } from "@/components/ui/misc";
import { addCatalogLine, convertQuote, deleteQuote, deleteQuoteLine, saveQuote, saveQuoteLine, sendQuote, setQuoteOutcome } from "@/features/finance/actions";
import { quoteFields } from "@/features/finance/fields";
import { LinesCard } from "@/features/finance/lines";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { QUOTE_STATUS } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Devis" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("finance.view");
  const { id } = await params;
  const supabase = await createClient();
  const { data: q } = await supabase.from("quotes").select("*, clients(id, name), quote_items(*), invoices(id, number, status)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!q) notFound();
  const [{ data: catalog }, clients, missions] = await Promise.all([
    supabase.from("service_catalog").select("id, code, name, unit_price").eq("is_active", true).order("code"),
    getClientOptions(),
    getMissionOptions(),
  ]);
  const draft = q.status === "brouillon";
  const client = q.clients as { id: string; name: string } | null;
  const lines = [...(q.quote_items ?? [])].sort((a, b) => a.position - b.position).map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price), discount_rate: Number(l.discount_rate), vat_rate: Number(l.vat_rate), total_ht: Number(l.total_ht) }));
  const invoice = (q.invoices as Array<{ id: string; number: string | null }> | null)?.[0];
  return (
    <>
      <PageHeader
        eyebrow={`NOAMIS FINANCE · Devis ${q.number}`}
        title={q.title}
        description={client ? <>Client : <Link className="text-gold-text hover:underline" href={`/pilot/clients/${client.id}`}>{client.name}</Link> · émis le {formatDate(q.issue_date)} · valable jusqu&apos;au {formatDate(q.valid_until)}</> : undefined}
        actions={
          <>
            <StatusBadge map={QUOTE_STATUS} value={q.status} />
            <Button asChild variant="outline"><a href={`/api/pdf/quote/${q.id}`}><FileDown /> PDF</a></Button>
            {draft && <FormDialog title="Modifier le devis" size="lg" trigger={<Button variant="secondary"><Pencil /> Modifier</Button>} schema="quote" fields={quoteFields(clients, missions)} defaultValues={q} hidden={{ id: q.id }} action={saveQuote} />}
            {draft && <ActionButton action={sendQuote.bind(null, q.id)} confirm={{ title: "Envoyer le devis ?", description: "Le devis sera figé et visible dans le portail du client, qui pourra l'accepter ou le refuser en ligne.", confirmLabel: "Envoyer" }}><Send /> Envoyer</ActionButton>}
            {q.status === "envoye" && (
              <>
                <ActionButton variant="secondary" action={setQuoteOutcome.bind(null, q.id, "accepte")} confirm={{ title: "Enregistrer l'acceptation ?", description: "À utiliser si le client a signé hors portail (bon pour accord).", confirmLabel: "Accepté" }}><CheckCircle2 /> Accepté</ActionButton>
                <ActionButton variant="ghost" action={setQuoteOutcome.bind(null, q.id, "refuse")} confirm={{ title: "Enregistrer le refus ?", description: "Le devis passera au statut « Refusé ».", confirmLabel: "Refusé", danger: true }}><XCircle /> Refusé</ActionButton>
              </>
            )}
            {q.status === "accepte" && <ActionButton action={convertQuote.bind(null, q.id)} redirectTo="/finance/invoices/:id"><Receipt /> Convertir en facture</ActionButton>}
            {draft && can(session.role, "finance.issue") && <ActionButton variant="ghost" action={deleteQuote.bind(null, q.id)} redirectTo="/finance/quotes" confirm={{ title: "Supprimer ce brouillon ?", description: "Le numéro attribué restera consommé (traçabilité).", danger: true, confirmLabel: "Supprimer" }}><Trash2 /></ActionButton>}
          </>
        }
      />
      {invoice && <div className="mb-6"><Notice tone="gold">Devis facturé : <Link className="underline" href={`/finance/invoices/${invoice.id}`}>{invoice.number ?? "facture brouillon"}</Link></Notice></div>}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LinesCard
            lines={lines}
            totals={{ subtotal_ht: Number(q.subtotal_ht), discount_amount: Number(q.discount_amount), total_ht: Number(q.total_ht), total_vat: Number(q.total_vat), total_ttc: Number(q.total_ttc), discount_rate: Number(q.discount_rate), vat_breakdown: (q.vat_breakdown ?? []) as Array<{ rate: number; base: string; vat: string }> }}
            editable={draft}
            catalog={(catalog ?? []).map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
            saveAction={saveQuoteLine.bind(null, q.id)}
            deleteAction={deleteQuoteLine.bind(null, q.id)}
            addFromCatalog={addCatalogLine.bind(null, "quote", q.id)}
          />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Suivi" as="h3" />
            <CardBody>
              <DefinitionList items={[
                { label: "Envoyé le", value: formatDateTime(q.sent_at) },
                { label: "Réponse le", value: formatDateTime(q.responded_at) },
                { label: "Commentaire client", value: q.response_comment },
                { label: "Conditions de paiement", value: q.payment_terms },
              ]} />
            </CardBody>
          </Card>
          <Card><CardHeader title="Historique" as="h3" /><CardBody><HistoryTimeline session={session} entityType="quotes" entityId={q.id} /></CardBody></Card>
        </div>
      </div>
    </>
  );
}
