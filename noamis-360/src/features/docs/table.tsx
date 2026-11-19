"use client";
import Link from "next/link";
import { Download, Eye, Lock } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { CONFIDENTIALITY, DOC_CATEGORIES, optionsOf } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export type DocRow = {
  id: string; title: string; category: string; confidentiality: string; client_visible: boolean; client: string | null; client_id: string | null;
  mission: string | null; mission_id: string | null; version: number; updated_at: string; archived: boolean; tags: string[]; description: string | null;
};

export function DocumentsTable({ rows }: { rows: DocRow[] }) {
  return (
    <DataTable
      caption="Documents"
      rows={rows}
      searchText={(r) => `${r.title} ${r.tags.join(" ")} ${r.client ?? ""} ${r.mission ?? ""} ${r.description ?? ""}`}
      searchPlaceholder="Rechercher (titre, mot-clé, client, mission)…"
      onRowHref={(r) => `/docs/${r.id}`}
      emptyTitle="Aucun document"
      filters={[
        { key: "cat", label: "Catégorie", options: optionsOf(DOC_CATEGORIES), predicate: (r, v) => r.category === v },
        { key: "conf", label: "Confidentialité", options: optionsOf(CONFIDENTIALITY), predicate: (r, v) => r.confidentiality === v },
        { key: "arch", label: "État", options: [{ value: "actif", label: "Actifs" }, { value: "archive", label: "Archivés" }], predicate: (r, v) => (v === "archive" ? r.archived : !r.archived) },
      ]}
      columns={[
        {
          key: "title", header: "Document", sortValue: (r) => r.title.toLowerCase(),
          cell: (r) => (
            <span className="flex items-center gap-2">
              {r.confidentiality === "restreint" && <Lock className="size-3.5 text-danger" aria-label="Restreint" />}
              <Link href={`/docs/${r.id}`} className="font-medium hover:text-gold-text">{r.title}</Link>
              {r.archived && <Badge>Archivé</Badge>}
            </span>
          ),
        },
        { key: "cat", header: "Catégorie", cell: (r) => <StatusBadge map={DOC_CATEGORIES} value={r.category} />, hideOnMobile: true },
        { key: "client", header: "Client / mission", cell: (r) => <span className="text-sm">{r.client ?? "—"}{r.mission ? <span className="block text-xs text-muted">{r.mission}</span> : null}</span>, hideOnMobile: true },
        { key: "v", header: "Version", cell: (r) => `v${r.version}`, className: "tabular-nums", hideOnMobile: true },
        { key: "date", header: "Modifié", cell: (r) => formatDate(r.updated_at), sortValue: (r) => r.updated_at, hideOnMobile: true },
        { key: "vis", header: "Portail", cell: (r) => (r.client_visible ? <Badge tone="gold"><Eye className="size-3" /> Partagé</Badge> : <span className="text-xs text-muted">Interne</span>) },
        {
          key: "dl", header: "", cell: (r) => r.version > 0 && (
            <a href={`/api/documents/${r.id}/download`} className="inline-flex rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-foreground" aria-label={`Télécharger ${r.title}`}>
              <Download className="size-4" />
            </a>
          ),
        },
      ]}
    />
  );
}
