import type { Metadata } from "next";
import Link from "next/link";
import { Bot, ExternalLink, FilePlus2, Pencil, Plus, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { EmptyState, Notice, PageHeader, StatCard } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { collectSource, createAiDraft, createReportFromRetained, saveReport, saveSource } from "@/features/intelligence/actions";
import { aiConnectorStatus } from "@/features/intelligence/ai";
import { reportFields, sourceFields } from "@/features/intelligence/fields";
import { ItemsTable } from "@/features/intelligence/items-table";
import { requireCapability } from "@/lib/auth/session";
import { RELIABILITY, REPORT_KINDS, REPORT_STATUS, SEVERITY, SOURCE_KINDS, labelOf } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Intelligence & veille" };

export default async function IntelligencePage() {
  await requireCapability("intelligence.manage");
  const supabase = await createClient();
  const [sources, items, reports] = await Promise.all([
    supabase.from("intelligence_sources").select("*").is("deleted_at", null).order("name"),
    supabase.from("intelligence_items").select("id, title, url, published_at, excerpt, status, credibility, intelligence_sources(name, reliability)").order("published_at", { ascending: false, nullsFirst: false }).limit(300),
    supabase.from("intelligence_reports").select("id, kind, title, status, severity, ai_generated, themes, created_at, published_at").order("created_at", { ascending: false }),
  ]);
  const ai = aiConnectorStatus();
  const itemRows = (items.data ?? []).map((i) => {
    const s = i.intelligence_sources as { name: string; reliability: string } | null;
    return { id: i.id, title: i.title, url: i.url, published_at: i.published_at, excerpt: i.excerpt, status: i.status, credibility: i.credibility, source: s?.name ?? "—", reliability: s?.reliability ?? "F" };
  });
  const retained = itemRows.filter((i) => i.status === "retenu").length;

  return (
    <>
      <PageHeader
        eyebrow="NOAMIS INTELLIGENCE"
        title="Veille et analyse des risques"
        description="Sources publiques évaluées, collecte de contenus autorisés, fiches de veille, bulletins et alertes. Toute analyse doit être validée par un analyste avant diffusion."
        actions={
          <FormDialog
            title="Nouveau rapport"
            size="lg"
            trigger={<Button><Plus /> Nouveau rapport</Button>}
            schema="report"
            fields={reportFields}
            defaultValues={{ kind: "fiche", severity: "information" }}
            action={saveReport}
            redirectTo="/intelligence/reports/:id"
          />
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Sources actives" value={(sources.data ?? []).filter((s) => s.is_active).length} />
        <StatCard label="Contenus à trier" value={itemRows.filter((i) => i.status === "nouveau").length} tone="info" />
        <StatCard label="Contenus retenus" value={retained} tone="gold" />
        <StatCard label="Rapports diffusés" value={(reports.data ?? []).filter((r) => r.status === "diffuse").length} tone="success" />
      </div>

      <Tabs
        tabs={[
          {
            value: "veille",
            label: "Veille",
            count: itemRows.length,
            content: (
              <div className="space-y-4">
                <Card>
                  <CardBody className="flex flex-wrap items-center gap-3">
                    <p className="flex-1 text-sm text-muted">{retained} contenu(s) retenu(s) : transformez-les en fiche de veille avec leurs références datées.</p>
                    <FormDialog title="Créer une fiche à partir des contenus retenus" size="sm" columns={1} trigger={<Button variant="secondary" disabled={!retained}><FilePlus2 /> Fiche manuelle</Button>} schema="aiDraft" fields={[{ name: "topic", label: "Sujet de la fiche", required: true }]} action={createReportFromRetained} redirectTo="/intelligence/reports/:id" />
                    {ai.enabled ? (
                      <FormDialog
                        title="Brouillon d'analyse assisté par IA"
                        description={`Modèle ${ai.model}. Seuls les titres, liens, dates et extraits des sources publiques retenues sont transmis. Le résultat est un brouillon à valider.`}
                        size="md"
                        columns={1}
                        trigger={<Button variant="outline" disabled={!retained}><Bot /> Brouillon IA</Button>}
                        schema="aiDraft"
                        fields={[{ name: "topic", label: "Sujet de l'analyse", required: true }]}
                        action={createAiDraft}
                        redirectTo="/intelligence/reports/:id"
                      />
                    ) : (
                      <Badge tone="neutral"><Bot className="size-3" /> Connecteur IA non configuré</Badge>
                    )}
                  </CardBody>
                </Card>
                <ItemsTable rows={itemRows} />
              </div>
            ),
          },
          {
            value: "rapports",
            label: "Fiches, bulletins & alertes",
            count: reports.data?.length ?? 0,
            content: reports.data?.length ? (
              <Card>
                <CardBody className="p-0">
                  <ul className="divide-y divide-border">
                    {reports.data.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <StatusBadge map={REPORT_KINDS} value={r.kind} />
                        <Link href={`/intelligence/reports/${r.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-gold-text">{r.title}</Link>
                        {r.ai_generated && <Badge tone="warning"><Bot className="size-3" /> IA</Badge>}
                        {r.severity && <StatusBadge map={SEVERITY} value={r.severity} />}
                        <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                        <StatusBadge map={REPORT_STATUS} value={r.status} />
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : (
              <EmptyState title="Aucun rapport" />
            ),
          },
          {
            value: "sources",
            label: "Sources",
            count: sources.data?.length ?? 0,
            content: (
              <div className="space-y-4">
                <Notice tone="info" title="Collecte responsable">
                  Seuls les flux RSS/Atom publiés par des sources marquées « collecte autorisée » sont récupérés, après vérification de robots.txt. Aucune protection
                  n&apos;est contournée et seuls le titre, le lien, la date et un court extrait sont conservés.
                </Notice>
                <div className="flex justify-end">
                  <FormDialog title="Nouvelle source" size="lg" trigger={<Button size="sm"><Plus /> Source</Button>} schema="source" fields={sourceFields} defaultValues={{ kind: "institutionnel", reliability: "F", is_active: true }} action={saveSource} />
                </div>
                {sources.data?.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {sources.data.map((s) => (
                      <Card key={s.id}>
                        <CardHeader
                          as="h3"
                          title={s.name}
                          description={`${labelOf(SOURCE_KINDS, s.kind)} · ${s.themes.join(", ") || "sans thème"}`}
                          action={
                            <>
                              <StatusBadge map={RELIABILITY} value={s.reliability} />
                              <FormDialog title="Modifier la source" size="lg" trigger={<Button variant="ghost" size="icon-sm" aria-label={`Modifier ${s.name}`}><Pencil /></Button>} schema="source" fields={sourceFields} defaultValues={s} hidden={{ id: s.id }} action={saveSource} />
                            </>
                          }
                        />
                        <CardBody className="flex flex-wrap items-center gap-3 text-sm">
                          <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-muted hover:text-foreground">
                            Site <ExternalLink className="size-3" />
                          </a>
                          <span className="text-muted">Dernière collecte : {formatDateTime(s.last_collected_at)}</span>
                          <span className="flex-1" />
                          {s.collection_allowed && s.feed_url ? (
                            <ActionButton size="sm" variant="secondary" action={collectSource.bind(null, s.id)}><RefreshCw /> Collecter</ActionButton>
                          ) : (
                            <Badge>{s.feed_url ? "Collecte non autorisée" : "Consultation manuelle"}</Badge>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Aucune source" />
                )}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
