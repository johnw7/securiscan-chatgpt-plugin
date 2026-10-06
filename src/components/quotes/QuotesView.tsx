"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Euro, XCircle } from "lucide-react";
import type { QuoteStatus } from "@/lib/types";
import { useStore } from "@/lib/store/AppStore";
import { getClient } from "@/lib/store/selectors";
import { formatCurrency } from "@/lib/format";
import { matches } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { SearchInput } from "@/components/ui/SearchInput";
import { QuoteList } from "./QuoteList";

type Filter = "ALL" | QuoteStatus;

export function QuotesView() {
  const { data } = useStore();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const pending = data.quotes.filter((q) => q.status === "EN_ATTENTE");
  const accepted = data.quotes.filter((q) => q.status === "ACCEPTE");
  const refused = data.quotes.filter((q) => q.status === "REFUSE");
  const potential = pending.reduce((s, q) => s + q.amount, 0);
  const rate = Math.round((accepted.length / Math.max(1, accepted.length + refused.length)) * 100);

  const rows = useMemo(
    () =>
      data.quotes
        .filter((q) => (filter === "ALL" || q.status === filter) && matches(query, q.id, q.title, getClient(data, q.clientId)?.name))
        .sort((a, b) => b.id.localeCompare(a.id)),
    [data, filter, query],
  );

  return (
    <>
      <PageHeader eyebrow="Commercial" title="Devis" subtitle={`Taux de transformation : ${rate} % · ${data.quotes.length} devis émis cette année`} />

      <section className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="En attente" value={pending.length} icon={<Clock3 className="size-[18px]" />} />
        <StatCard label="Acceptés" value={accepted.length} icon={<CheckCircle2 className="size-[18px]" />} trend={14} trendLabel="vs trimestre précédent" style={{ animationDelay: "60ms" }} />
        <StatCard label="Refusés" value={refused.length} icon={<XCircle className="size-[18px]" />} style={{ animationDelay: "120ms" }} />
        <StatCard accent label="CA potentiel" value={potential} format={(v) => formatCurrency(v)} icon={<Euro className="size-[18px]" />} style={{ animationDelay: "180ms" }} />
      </section>

      <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: "120ms" }}>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            size="sm"
            value={filter}
            onChange={setFilter}
            ariaLabel="Filtrer les devis"
            options={[
              { value: "ALL", label: "Tous", count: data.quotes.length },
              { value: "EN_ATTENTE", label: "En attente", count: pending.length },
              { value: "ACCEPTE", label: "Acceptés", count: accepted.length },
              { value: "REFUSE", label: "Refusés", count: refused.length },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un devis, un client…" className="w-full lg:max-w-xs" />
        </div>
        <QuoteList quotes={rows} />
      </Card>
    </>
  );
}
