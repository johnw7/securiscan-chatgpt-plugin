"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, Mail, Phone, Plus, Users } from "lucide-react";
import { useStore } from "@/lib/store/AppStore";
import { clientInterventionCount, clientLastIntervention } from "@/lib/store/selectors";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { matches } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconLink } from "@/components/ui/IconButton";
import { SortableTh, Table, Td, Th, Tr, nextSort, type SortState } from "@/components/ui/Table";
import { ClientForm } from "./ClientForm";

type SortKey = "name" | "interventions" | "revenue" | "last";

export function ClientsView() {
  const { data, today } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "name", dir: "asc" });

  const rows = useMemo(() => {
    const list = data.clients
      .filter((c) => matches(query, c.name, c.contactName, c.email, c.phone, c.city, c.sector))
      .map((c) => ({
        client: c,
        interventions: clientInterventionCount(data, c.id),
        last: clientLastIntervention(data, c.id, today)?.date ?? "",
      }));
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      if (sort.key === "name") return a.client.name.localeCompare(b.client.name) * dir;
      if (sort.key === "interventions") return (a.interventions - b.interventions) * dir;
      if (sort.key === "revenue") return (a.client.revenue - b.client.revenue) * dir;
      return a.last.localeCompare(b.last) * dir;
    });
  }, [data, query, sort, today]);

  const totalRevenue = data.clients.reduce((s, c) => s + c.revenue, 0);
  const onSort = (key: SortKey) => setSort((s) => nextSort(s, key, ["name"]));

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Clients"
        subtitle={`${data.clients.length} clients actifs · ${formatCurrency(totalRevenue)} de chiffre d'affaires cumulé`}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Nouveau client
          </Button>
        }
      />

      <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: "80ms" }}>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un client..." className="w-full sm:max-w-sm" />
          <p className="text-xs text-muted">
            {rows.length} résultat{rows.length > 1 ? "s" : ""}
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title="Aucun client trouvé" text="Essayez avec un autre nom, une ville ou un contact." />
        ) : (
          <>
            {/* Tableau (tablette et ordinateur) */}
            <Table className="hidden md:block">
              <thead>
                <tr>
                  <SortableTh label="Client" sortKey="name" sort={sort} onSort={onSort} />
                  <Th>Contact</Th>
                  <Th className="hidden xl:table-cell">Téléphone</Th>
                  <Th className="hidden 2xl:table-cell">Email</Th>
                  <SortableTh label="Interventions" sortKey="interventions" sort={sort} onSort={onSort} className="text-right" />
                  <SortableTh label="CA" sortKey="revenue" sort={sort} onSort={onSort} className="text-right" />
                  <SortableTh label="Dernière intervention" sortKey="last" sort={sort} onSort={onSort} className="hidden lg:table-cell" />
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ client: c, interventions, last }) => (
                  <Tr key={c.id} className="cursor-pointer" onClick={() => router.push(`/clients/${c.id}`)}>
                    <Td>
                      <Link href={`/clients/${c.id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-electric-50 text-electric">
                          <Building2 className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-navy group-hover:text-electric">{c.name}</span>
                          <span className="block truncate text-xs text-muted">{c.sector} · {c.city.replace(/^\d+\s/, "")}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        <Avatar name={c.contactName} size="xs" />
                        <span className="whitespace-nowrap text-slate-700">{c.contactName}</span>
                      </span>
                    </Td>
                    <Td className="hidden whitespace-nowrap text-slate-600 tabular xl:table-cell">{c.phone}</Td>
                    <Td className="hidden text-slate-600 2xl:table-cell">{c.email}</Td>
                    <Td className="text-right font-semibold text-navy tabular">{interventions}</Td>
                    <Td className="text-right font-semibold whitespace-nowrap text-navy tabular">{formatCurrency(c.revenue)}</Td>
                    <Td className="hidden whitespace-nowrap text-slate-600 lg:table-cell">{last ? formatDate(last) : "—"}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <IconLink href={`tel:${c.phone.replace(/\s/g, "")}`} label={`Appeler ${c.contactName}`} external>
                          <Phone className="size-4" />
                        </IconLink>
                        <IconLink href={`mailto:${c.email}`} label={`Écrire à ${c.contactName}`} external>
                          <Mail className="size-4" />
                        </IconLink>
                        <IconLink href={`/clients/${c.id}`} label="Ouvrir la fiche client">
                          <ChevronRight className="size-4" />
                        </IconLink>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>

            {/* Cartes (smartphone) */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map(({ client: c, interventions }) => (
                <li key={c.id}>
                  <Link href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-50">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-electric-50 text-electric">
                      <Building2 className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">{c.name}</span>
                      <span className="block truncate text-xs text-muted">{c.contactName} · {c.phone}</span>
                      <span className="mt-1 flex gap-3 text-xs text-slate-600">
                        <span><strong className="tabular text-navy">{interventions}</strong> interv.</span>
                        <span className="tabular font-semibold text-navy">{formatCurrency(c.revenue)}</span>
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <ClientForm open={creating} onClose={() => setCreating(false)} onCreated={(id) => router.push(`/clients/${id}`)} />
    </>
  );
}
