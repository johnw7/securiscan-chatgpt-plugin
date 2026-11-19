"use client";
import { ExternalLink } from "lucide-react";
import { InlineSelect } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { CREDIBILITY, ITEM_STATUS, RELIABILITY, optionsOf } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { setItemCredibility, setItemStatus } from "./actions";

export type ItemRow = { id: string; title: string; url: string; published_at: string | null; excerpt: string | null; status: string; credibility: number | null; source: string; reliability: string };

export function ItemsTable({ rows }: { rows: ItemRow[] }) {
  return (
    <DataTable
      caption="Contenus collectés"
      rows={rows}
      searchText={(r) => `${r.title} ${r.source} ${r.excerpt ?? ""}`}
      searchPlaceholder="Rechercher dans la veille…"
      emptyTitle="Aucun contenu collecté"
      emptyDescription="Lancez une collecte sur une source autorisée disposant d'un flux RSS."
      filters={[{ key: "status", label: "Statut", options: optionsOf(ITEM_STATUS), predicate: (r, v) => r.status === v }]}
      columns={[
        {
          key: "title", header: "Contenu", sortValue: (r) => r.title,
          cell: (r) => (
            <div className="max-w-xl">
              <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-start gap-1 font-medium hover:text-gold-text">
                {r.title} <ExternalLink className="mt-0.5 size-3 shrink-0" aria-label="(nouvel onglet)" />
              </a>
              {r.excerpt && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{r.excerpt}</p>}
            </div>
          ),
        },
        { key: "source", header: "Source", cell: (r) => <span className="text-sm">{r.source} <Badge tone={RELIABILITY[r.reliability]?.tone}>{r.reliability}</Badge></span>, hideOnMobile: true },
        { key: "date", header: "Publié", cell: (r) => formatDate(r.published_at), sortValue: (r) => r.published_at, hideOnMobile: true },
        { key: "cred", header: "Crédibilité", hideOnMobile: true, cell: (r) => <InlineSelect label={`Crédibilité de ${r.title}`} value={String(r.credibility ?? 6)} options={Object.entries(CREDIBILITY).map(([value, label]) => ({ value, label }))} action={(v) => setItemCredibility(r.id, v)} /> },
        { key: "status", header: "Tri", cell: (r) => (r.status === "archive" ? <StatusBadge map={ITEM_STATUS} value={r.status} /> : <InlineSelect label={`Tri de ${r.title}`} value={r.status} options={optionsOf(ITEM_STATUS).filter((o) => o.value !== "archive")} action={(v) => setItemStatus(r.id, v)} />) },
      ]}
    />
  );
}
