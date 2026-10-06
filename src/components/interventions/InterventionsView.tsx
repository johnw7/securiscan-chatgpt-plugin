"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, ChevronRight, Play, Plus, Wrench } from "lucide-react";
import type { Intervention, InterventionStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/constants";
import { useStore } from "@/lib/store/AppStore";
import { useAppActions } from "@/lib/store/useAppActions";
import { getClient, getMember, memberName } from "@/lib/store/selectors";
import { formatDate } from "@/lib/dates";
import { matches } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { SearchInput } from "@/components/ui/SearchInput";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton, IconLink } from "@/components/ui/IconButton";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { PriorityBadge, StatusBadge, TypeTag } from "./Badges";
import { InterventionForm } from "./InterventionForm";
import { ScheduleModal } from "./ScheduleModal";

type Filter = "ALL" | InterventionStatus;

const FILTER_LABELS: Record<Filter, string> = {
  ALL: "Toutes",
  A_PLANIFIER: "À planifier",
  PLANIFIEE: "Planifiées",
  EN_COURS: "En cours",
  TERMINEE: "Terminées",
  ANNULEE: "Annulées",
};

/** Intervention de démonstration pré-remplie (étape 2 du mode démo). */
function useDemoPrefill() {
  const { data, today } = useStore();
  const client = data.clients.find((c) => c.id === "cli-clinique")!;
  return {
    clientId: client.id,
    type: "depannage" as const,
    title: "Dépannage climatisation salle de réveil",
    description: "Température de 27 °C relevée en salle de réveil. Unité intérieure en défaut, code E4 affiché.",
    address: `${client.address}, ${client.city}`,
    date: today,
    time: "11:30",
    technicianId: "tech-lucas",
    durationMin: 90,
    priority: "URGENTE" as const,
  };
}

function sortInterventions(a: Intervention, b: Intervention) {
  if (!a.date && b.date) return -1;
  if (a.date && !b.date) return 1;
  return `${b.date ?? ""}${b.time ?? ""}`.localeCompare(`${a.date ?? ""}${a.time ?? ""}`);
}

export function InterventionsView() {
  const { data, today } = useStore();
  const actions = useAppActions();
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [creating, setCreating] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [scheduling, setScheduling] = useState<Intervention | null>(null);
  const demoPrefill = useDemoPrefill();

  useEffect(() => {
    const q = params.get("q");
    if (q !== null) setQuery(q);
    if (params.get("nouvelle")) {
      setDemoMode(params.get("nouvelle") === "demo");
      setCreating(true);
    }
  }, [params]);

  const searched = useMemo(
    () =>
      data.interventions.filter((i) => {
        const client = getClient(data, i.clientId);
        const tech = getMember(data, i.technicianId);
        return matches(query, i.id, i.title, client?.name, tech ? `${tech.firstName} ${tech.lastName}` : "", i.address);
      }),
    [data, query],
  );

  const counts = useMemo(() => {
    const c = { ALL: searched.length } as Record<Filter, number>;
    (Object.keys(STATUS_META) as InterventionStatus[]).forEach((s) => (c[s] = searched.filter((i) => i.status === s).length));
    return c;
  }, [searched]);

  const rows = useMemo(
    () => searched.filter((i) => filter === "ALL" || i.status === filter).sort(sortInterventions),
    [searched, filter],
  );

  const closeForm = () => {
    setCreating(false);
    if (params.get("nouvelle")) router.replace("/interventions", { scroll: false });
  };

  const options = (Object.keys(FILTER_LABELS) as Filter[]).map((f) => ({ value: f, label: FILTER_LABELS[f], count: counts[f] }));

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Interventions"
        subtitle={`${counts.EN_COURS} en cours · ${counts.PLANIFIEE} planifiées · ${counts.A_PLANIFIER} à planifier`}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => { setDemoMode(false); setCreating(true); }} className="tracking-wide uppercase">
            Nouvelle intervention
          </Button>
        }
      />

      <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: "80ms" }}>
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between sm:px-5">
          <Segmented options={options} value={filter} onChange={setFilter} size="sm" ariaLabel="Filtrer par statut" />
          <SearchInput value={query} onChange={setQuery} placeholder="Référence, client, technicien…" className="w-full xl:max-w-xs" />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<Wrench className="size-6" />} title="Aucune intervention" text="Modifiez les filtres ou la recherche." />
        ) : (
          <>
            <Table className="hidden md:block">
              <thead>
                <tr>
                  <Th>Référence</Th>
                  <Th>Client</Th>
                  <Th>Intervention</Th>
                  <Th className="hidden lg:table-cell">Technicien</Th>
                  <Th>Date</Th>
                  <Th className="hidden xl:table-cell">Heure</Th>
                  <Th>Statut</Th>
                  <Th className="hidden lg:table-cell">Priorité</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const tech = getMember(data, i.technicianId);
                  const isNew = i.createdAt.startsWith(today) && i.timeline.length <= 2 && i.status !== "TERMINEE";
                  return (
                    <Tr key={i.id} className="cursor-pointer" onClick={() => router.push(`/interventions/${i.id}`)}>
                      <Td className="font-semibold whitespace-nowrap text-navy tabular">
                        {i.id}
                        {isNew && <span className="ml-2 rounded bg-electric px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">Nouveau</span>}
                      </Td>
                      <Td className="max-w-[180px] truncate font-medium text-slate-700">{getClient(data, i.clientId)?.name}</Td>
                      <Td className="max-w-[260px]">
                        <p className="truncate font-medium text-navy group-hover:text-electric">{i.title}</p>
                        <TypeTag type={i.type} />
                      </Td>
                      <Td className="hidden lg:table-cell">
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Avatar name={memberName(tech)} color={tech?.color} size="xs" />
                          <span className="text-slate-700">{memberName(tech)}</span>
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">{i.date ? formatDate(i.date) : "—"}</Td>
                      <Td className="hidden whitespace-nowrap text-slate-600 tabular xl:table-cell">{i.time ?? "—"}</Td>
                      <Td><StatusBadge status={i.status} size="xs" /></Td>
                      <Td className="hidden lg:table-cell"><PriorityBadge priority={i.priority} size="xs" /></Td>
                      <Td>
                        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                          {i.status === "A_PLANIFIER" && (
                            <IconButton onClick={() => setScheduling(i)} label="Planifier">
                              <CalendarCheck className="size-4" />
                            </IconButton>
                          )}
                          {i.status === "PLANIFIEE" && i.date === today && (
                            <IconButton onClick={() => actions.startIntervention(i.id)} label="Démarrer">
                              <Play className="size-4" />
                            </IconButton>
                          )}
                          <IconLink href={`/interventions/${i.id}`} label="Ouvrir la fiche">
                            <ChevronRight className="size-4" />
                          </IconLink>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>

            <ul className="divide-y divide-line md:hidden">
              {rows.map((i) => (
                <li key={i.id}>
                  <Link href={`/interventions/${i.id}`} className="block px-4 py-3.5 active:bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="tabular text-xs font-semibold text-muted">{i.id}</span>
                      <StatusBadge status={i.status} size="xs" />
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-navy">{i.title}</p>
                    <p className="truncate text-xs text-slate-500">{getClient(data, i.clientId)?.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
                      <span>{i.date ? `${formatDate(i.date, "short")} · ${i.time}` : "À planifier"} · {memberName(getMember(data, i.technicianId), true)}</span>
                      <PriorityBadge priority={i.priority} size="xs" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <InterventionForm open={creating} onClose={closeForm} prefill={demoMode ? demoPrefill : undefined} />
      <ScheduleModal intervention={scheduling} onClose={() => setScheduling(null)} />
    </>
  );
}
