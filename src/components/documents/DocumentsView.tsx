"use client";

import { useMemo, useState } from "react";
import { HardDrive, ShieldCheck } from "lucide-react";
import type { DocumentType } from "@/lib/types";
import { DOCUMENT_TYPE_META } from "@/lib/constants";
import { useStore } from "@/lib/store/AppStore";
import { getClient } from "@/lib/store/selectors";
import { formatFileSize } from "@/lib/format";
import { matches } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { SearchInput } from "@/components/ui/SearchInput";
import { DocumentList } from "./DocumentList";
import { DocumentIcon } from "./DocumentIcon";

type Filter = "ALL" | DocumentType;

export function DocumentsView() {
  const { data } = useStore();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  // Les rapports des interventions clôturées pendant la démo sont ajoutés automatiquement.
  const documents = useMemo(() => {
    const existing = new Set(data.documents.map((d) => d.interventionId).filter(Boolean));
    const fresh = data.interventions
      .filter((i) => i.status === "TERMINEE" && i.date && !existing.has(i.id))
      .map((i) => ({
        id: `doc-r-${i.id}`,
        name: `Rapport d'intervention ${i.id}.pdf`,
        type: "rapport" as const,
        clientId: i.clientId,
        interventionId: i.id,
        sizeKb: 260 + i.photos.length * 180,
        date: i.date!,
        author: "Généré automatiquement",
      }));
    return [...fresh, ...data.documents];
  }, [data.documents, data.interventions]);

  const types = Object.keys(DOCUMENT_TYPE_META) as DocumentType[];
  const rows = documents.filter((d) => (filter === "ALL" || d.type === filter) && matches(query, d.name, getClient(data, d.clientId)?.name, d.author));
  const totalKb = documents.reduce((s, d) => s + d.sizeKb, 0);

  return (
    <>
      <PageHeader eyebrow="Archives" title="Documents" subtitle={`${documents.length} documents · ${formatFileSize(totalKb)} · rapports, devis, factures, contrats et photos centralisés`} />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {types.map((t, idx) => (
          <button
            key={t}
            onClick={() => setFilter(filter === t ? "ALL" : t)}
            className="animate-fade-up text-left"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <Card interactive className={filter === t ? "border-electric/40 ring-2 ring-electric/15" : undefined}>
              <div className="flex items-center gap-3 p-3.5">
                <DocumentIcon type={t} />
                <div>
                  <p className="tabular font-display text-lg leading-none font-bold text-navy">{documents.filter((d) => d.type === t).length}</p>
                  <p className="mt-1 text-xs text-muted">{DOCUMENT_TYPE_META[t].label}s</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </section>

      <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: "120ms" }}>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <Segmented
            size="sm"
            value={filter}
            onChange={setFilter}
            ariaLabel="Filtrer par type"
            options={[{ value: "ALL" as Filter, label: "Tous" }, ...types.map((t) => ({ value: t as Filter, label: `${DOCUMENT_TYPE_META[t].label}s` }))]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un document…" className="w-full xl:max-w-xs" />
        </div>
        <DocumentList documents={rows} />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-sm text-slate-600">
          <HardDrive className="mt-0.5 size-5 shrink-0 text-electric" />
          <p><strong className="text-navy">Stockage prévu :</strong> fichiers chiffrés sur un stockage objet (S3 / R2) avec URL signées et quotas par entreprise.</p>
        </div>
        <div className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-sm text-slate-600">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-electric" />
          <p><strong className="text-navy">Accès client :</strong> chaque client pourra retrouver ses rapports et factures depuis son espace personnel sécurisé.</p>
        </div>
      </div>
    </>
  );
}
