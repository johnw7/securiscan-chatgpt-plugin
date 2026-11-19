import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, FileText, Mail, Pencil, Phone, Plus, Star, Trash2, UserPlus } from "lucide-react";
import { HistoryTimeline } from "@/components/shared/history";
import { InternalNotes } from "@/components/shared/notes";
import { ActionButton } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { DefinitionList, EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { amountDue, sum } from "@/features/finance/calc";
import { archiveClient, deleteContact, saveClient, saveContact, saveMission } from "@/features/pilot/actions";
import { clientFields, contactFields, missionFields } from "@/features/pilot/fields";
import { getClientOptions, getStaffOptions } from "@/features/pilot/queries";
import { MissionsTable } from "@/features/pilot/tables";
import { requireCapability } from "@/lib/auth/session";
import { CLIENT_CATEGORIES, CLIENT_STATUS, DOC_CATEGORIES, INVOICE_STATUS, QUOTE_STATUS, labelOf } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEUR } from "@/lib/utils";

export const metadata: Metadata = { title: "Fiche client" };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("crm.manage");
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!client) notFound();

  const [contacts, missions, documents, quotes, invoices, portalUsers, staff, clients] = await Promise.all([
    supabase.from("contacts").select("*").eq("client_id", id).is("deleted_at", null).order("is_primary", { ascending: false }),
    supabase
      .from("missions")
      .select("id, reference, title, service_type, status, progress, end_date, budget, is_confidential, profiles!missions_manager_id_fkey(full_name)")
      .eq("client_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("documents").select("id, title, category, current_version, client_visible, updated_at").eq("client_id", id).is("deleted_at", null).order("updated_at", { ascending: false }).limit(30),
    supabase.from("quotes").select("id, number, title, status, total_ttc, issue_date").eq("client_id", id).is("deleted_at", null).order("issue_date", { ascending: false }),
    supabase.from("invoices").select("id, number, title, status, kind, total_ttc, amount_paid, amount_credited, due_date").eq("client_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("memberships").select("user_id, active, profiles(full_name, email)").eq("client_id", id).eq("role", "client"),
    getStaffOptions(),
    getClientOptions(),
  ]);

  const missionRows = (missions.data ?? []).map((m) => ({
    id: m.id, reference: m.reference, title: m.title, client: client.name, service_type: m.service_type, status: m.status, progress: m.progress,
    end_date: m.end_date, budget: m.budget === null ? null : String(m.budget), is_confidential: m.is_confidential,
    manager: (m.profiles as { full_name: string | null } | null)?.full_name ?? null,
  }));
  const openInvoices = (invoices.data ?? []).filter((i) => i.kind === "facture" && ["emise", "partiellement_payee"].includes(i.status));
  const invoicedTotal = sum((invoices.data ?? []).filter((i) => i.status !== "brouillon").map((i) => i.total_ttc));

  return (
    <>
      <PageHeader
        eyebrow={labelOf(CLIENT_CATEGORIES, client.category)}
        title={client.name}
        description={[client.city, client.email, client.phone].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <StatusBadge map={CLIENT_STATUS} value={client.status} />
            <FormDialog
              title="Modifier le client"
              size="lg"
              trigger={<Button variant="secondary"><Pencil /> Modifier</Button>}
              schema="client"
              fields={clientFields(staff)}
              defaultValues={client}
              hidden={{ id: client.id }}
              action={saveClient}
            />
            {can(session.role, "admin.users") && (
              <Button asChild variant="outline">
                <Link href={`/admin/users?client=${client.id}`}><UserPlus /> Accès portail</Link>
              </Button>
            )}
            {can(session.role, "mission.delete") && (
              <ActionButton
                variant="ghost"
                action={archiveClient.bind(null, client.id)}
                redirectTo="/pilot/clients"
                confirm={{ title: "Archiver ce client ?", description: "La fiche n'apparaîtra plus dans les listes. Les données et l'historique sont conservés.", danger: true, confirmLabel: "Archiver" }}
              >
                <Archive /> Archiver
              </ActionButton>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Missions" value={missionRows.length} hint={`${missionRows.filter((m) => m.status === "en_cours").length} en cours`} />
        <StatCard label="Facturé TTC (cumul)" value={formatEUR(invoicedTotal)} tone="success" />
        <StatCard label="Reste à encaisser" value={formatEUR(sum(openInvoices.map((i) => amountDue(i))))} tone={openInvoices.length ? "warning" : "gold"} />
      </div>

      <Tabs
        tabs={[
          {
            value: "synthese",
            label: "Synthèse",
            content: (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader title="Informations" />
                  <CardBody>
                    <DefinitionList
                      items={[
                        { label: "Catégorie", value: labelOf(CLIENT_CATEGORIES, client.category) },
                        { label: "Secteur", value: client.sector },
                        { label: "SIREN / SIRET", value: [client.siren, client.siret].filter(Boolean).join(" / ") || null },
                        { label: "TVA intracom.", value: client.vat_number },
                        { label: "Adresse", value: [client.address_line, client.postal_code, client.city].filter(Boolean).join(", ") || null },
                        { label: "Site internet", value: client.website },
                        { label: "Responsable NOAMIS", value: staff.find((s) => s.value === client.owner_id)?.label },
                        { label: "Client depuis", value: formatDate(client.created_at) },
                      ]}
                    />
                    {client.notes && <p className="mt-5 whitespace-pre-wrap border-t border-border pt-4 text-sm text-muted">{client.notes}</p>}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Accès portail CONNECT" />
                  <CardBody>
                    {portalUsers.data?.length ? (
                      <ul className="space-y-2 text-sm">
                        {portalUsers.data.map((u) => {
                          const p = u.profiles as { full_name: string | null; email: string } | null;
                          return (
                            <li key={u.user_id} className="flex items-center justify-between gap-2">
                              <span className="truncate">{p?.full_name || p?.email}</span>
                              <Badge tone={u.active ? "success" : "neutral"}>{u.active ? "Actif" : "Désactivé"}</Badge>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted">Aucun compte portail. Un administrateur peut inviter un interlocuteur du client.</p>
                    )}
                  </CardBody>
                </Card>
              </div>
            ),
          },
          {
            value: "contacts",
            label: "Contacts",
            count: contacts.data?.length ?? 0,
            content: (
              <Card>
                <CardHeader
                  title="Interlocuteurs"
                  action={
                    <FormDialog
                      title="Nouveau contact"
                      trigger={<Button size="sm"><Plus /> Ajouter</Button>}
                      schema="contact"
                      fields={contactFields}
                      hidden={{ client_id: client.id }}
                      action={saveContact}
                      successMessage="Contact ajouté"
                    />
                  }
                />
                <CardBody className="p-0">
                  {contacts.data?.length ? (
                    <ul className="divide-y divide-border">
                      {contacts.data.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 font-medium">
                              {c.first_name} {c.last_name}
                              {c.is_primary && <Star className="size-3.5 fill-gold text-gold" aria-label="Contact principal" />}
                            </p>
                            <p className="text-xs text-muted">{c.job_title ?? "—"}</p>
                          </div>
                          {c.email && <a className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground" href={`mailto:${c.email}`}><Mail className="size-4" />{c.email}</a>}
                          {c.phone && <a className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground" href={`tel:${c.phone}`}><Phone className="size-4" />{c.phone}</a>}
                          <FormDialog
                            title="Modifier le contact"
                            trigger={<Button variant="ghost" size="icon-sm" aria-label={`Modifier ${c.first_name} ${c.last_name}`}><Pencil /></Button>}
                            schema="contact"
                            fields={contactFields}
                            defaultValues={c}
                            hidden={{ id: c.id, client_id: client.id }}
                            action={saveContact}
                          />
                          <ActionButton
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Supprimer ${c.first_name} ${c.last_name}`}
                            action={deleteContact.bind(null, c.id)}
                            confirm={{ title: "Supprimer ce contact ?", description: `${c.first_name} ${c.last_name} sera retiré de la fiche.`, danger: true, confirmLabel: "Supprimer" }}
                          >
                            <Trash2 />
                          </ActionButton>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-5"><EmptyState title="Aucun contact" /></div>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            value: "missions",
            label: "Missions",
            count: missionRows.length,
            content: (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <FormDialog
                    title="Nouvelle mission"
                    size="lg"
                    trigger={<Button size="sm"><Plus /> Nouvelle mission</Button>}
                    schema="mission"
                    fields={missionFields(clients, staff)}
                    defaultValues={{ client_id: client.id, status: "planifiee", progress: 0, client_visible: true, manager_id: session.userId, service_type: "audit_surete" }}
                    action={saveMission}
                    redirectTo="/pilot/missions/:id"
                  />
                </div>
                <MissionsTable rows={missionRows} hideClient />
              </div>
            ),
          },
          {
            value: "documents",
            label: "Documents",
            count: documents.data?.length ?? 0,
            content: (
              <Card>
                <CardHeader title="Documents du client" action={<Button asChild size="sm" variant="secondary"><Link href={`/docs?client=${client.id}`}>Gestion documentaire</Link></Button>} />
                <CardBody className="p-0">
                  {documents.data?.length ? (
                    <ul className="divide-y divide-border">
                      {documents.data.map((d) => (
                        <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                          <FileText className="size-4 text-gold-text" aria-hidden />
                          <Link href={`/docs/${d.id}`} className="flex-1 truncate text-sm hover:text-gold-text">{d.title}</Link>
                          <StatusBadge map={DOC_CATEGORIES} value={d.category} />
                          <span className="text-xs text-muted">v{d.current_version}</span>
                          {d.client_visible && <Badge tone="gold">Partagé</Badge>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-5"><EmptyState title="Aucun document" /></div>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            value: "finance",
            label: "Finance",
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Devis" action={<Button asChild size="sm" variant="secondary"><Link href={`/finance/quotes/new?client=${client.id}`}><Plus /> Devis</Link></Button>} />
                  <CardBody className="p-0">
                    {quotes.data?.length ? (
                      <ul className="divide-y divide-border">
                        {quotes.data.map((q) => (
                          <li key={q.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                            <Link href={`/finance/quotes/${q.id}`} className="flex-1 truncate hover:text-gold-text">{q.number} — {q.title}</Link>
                            <span className="tabular-nums">{formatEUR(q.total_ttc)}</span>
                            <StatusBadge map={QUOTE_STATUS} value={q.status} />
                          </li>
                        ))}
                      </ul>
                    ) : <div className="p-5"><EmptyState title="Aucun devis" /></div>}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Factures et avoirs" />
                  <CardBody className="p-0">
                    {invoices.data?.length ? (
                      <ul className="divide-y divide-border">
                        {invoices.data.map((i) => (
                          <li key={i.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                            <Link href={`/finance/invoices/${i.id}`} className="flex-1 truncate hover:text-gold-text">{i.number ?? "Brouillon"} — {i.title}</Link>
                            <span className="tabular-nums">{formatEUR(i.total_ttc)}</span>
                            <StatusBadge map={INVOICE_STATUS} value={i.status} />
                          </li>
                        ))}
                      </ul>
                    ) : <div className="p-5"><EmptyState title="Aucune facture" /></div>}
                  </CardBody>
                </Card>
              </div>
            ),
          },
          { value: "notes", label: "Notes internes", content: <InternalNotes scope={{ client_id: client.id }} /> },
          { value: "historique", label: "Historique", content: <Card><CardBody><HistoryTimeline session={session} entityType="clients" entityId={client.id} /></CardBody></Card> },
        ]}
      />
    </>
  );
}
