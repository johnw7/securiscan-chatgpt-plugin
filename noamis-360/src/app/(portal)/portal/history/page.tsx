import type { Metadata } from "next";
import { Briefcase, ClipboardCheck, FileText, MessagesSquare, Receipt } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Historique" };

type Event = { at: string; label: string; icon: typeof FileText };

/** Chronologie des échanges avec NOAMIS (données déjà filtrées par la RLS). */
export default async function PortalHistory() {
  await requireClient();
  const supabase = await createClient();
  const [missions, docs, quotes, invoices, approvals, messages] = await Promise.all([
    supabase.from("missions").select("title, created_at, status, updated_at"),
    supabase.from("document_versions").select("file_name, version, created_at, documents(title)"),
    supabase.from("quotes").select("number, title, sent_at, responded_at, status"),
    supabase.from("invoices").select("number, kind, issued_at, status"),
    supabase.from("client_approvals").select("title, created_at, responded_at, status"),
    supabase.from("messages").select("created_at, from_client").order("created_at", { ascending: false }).limit(50),
  ]);
  const events: Event[] = [
    ...(missions.data ?? []).map((m) => ({ at: m.created_at, label: `Mission ouverte : ${m.title}`, icon: Briefcase })),
    ...(docs.data ?? []).map((d) => ({ at: d.created_at, label: `Document ${(d.documents as { title: string } | null)?.title ?? d.file_name} — version ${d.version}`, icon: FileText })),
    ...(quotes.data ?? []).flatMap((q) => [
      ...(q.sent_at ? [{ at: q.sent_at, label: `Devis ${q.number} reçu : ${q.title}`, icon: Receipt }] : []),
      ...(q.responded_at ? [{ at: q.responded_at, label: `Devis ${q.number} ${q.status === "refuse" ? "refusé" : "accepté"}`, icon: Receipt }] : []),
    ]),
    ...(invoices.data ?? []).filter((i) => i.issued_at).map((i) => ({ at: i.issued_at!, label: `${i.kind === "avoir" ? "Avoir" : "Facture"} ${i.number} émis(e)`, icon: Receipt })),
    ...(approvals.data ?? []).flatMap((a) => [
      { at: a.created_at, label: `Validation demandée : ${a.title}`, icon: ClipboardCheck },
      ...(a.responded_at ? [{ at: a.responded_at, label: `Validation ${a.status === "approuve" ? "accordée" : "refusée"} : ${a.title}`, icon: ClipboardCheck }] : []),
    ]),
    ...(messages.data ?? []).map((m) => ({ at: m.created_at, label: m.from_client ? "Message envoyé à NOAMIS" : "Message reçu de NOAMIS", icon: MessagesSquare })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title="Historique" description="Chronologie de votre relation avec NOAMIS." />
      {events.length ? (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {events.slice(0, 200).map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[33px] top-0 rounded-full border border-border bg-surface p-1.5 text-gold-text"><e.icon className="size-3.5" aria-hidden /></span>
              <p className="text-sm">{e.label}</p>
              <time className="text-xs text-muted" dateTime={e.at}>{formatDateTime(e.at)}</time>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="Aucun événement" />
      )}
    </>
  );
}
