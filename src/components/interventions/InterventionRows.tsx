"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Intervention } from "@/lib/types";
import { useStore } from "@/lib/store/AppStore";
import { getClient, getMember, memberName } from "@/lib/store/selectors";
import { formatDate } from "@/lib/dates";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityBadge, StatusBadge, TypeTag } from "./Badges";

/** Liste compacte d'interventions (fiche client, vue technicien…). */
export function InterventionRows({ items, showClient = true }: { items: Intervention[]; showClient?: boolean }) {
  const { data } = useStore();
  return (
    <ul className="divide-y divide-line">
      {items.map((i) => {
        const tech = getMember(data, i.technicianId);
        return (
          <li key={i.id}>
            <Link href={`/interventions/${i.id}`} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5">
              <div className="w-20 shrink-0">
                <p className="text-[13px] font-semibold text-navy">{i.date ? formatDate(i.date, "short") : "À planifier"}</p>
                <p className="tabular text-xs text-muted">{i.time ?? "—"}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy group-hover:text-electric">{i.title}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span className="tabular">{i.id}</span>
                  <TypeTag type={i.type} className="text-xs" />
                  {showClient && <span className="truncate">{getClient(data, i.clientId)?.name}</span>}
                </p>
              </div>
              <span className="hidden items-center gap-2 md:flex">
                <Avatar name={memberName(tech)} color={tech?.color} size="xs" />
                <span className="w-28 truncate text-xs text-slate-600">{memberName(tech)}</span>
              </span>
              <span className="hidden lg:block">
                <PriorityBadge priority={i.priority} size="xs" />
              </span>
              <StatusBadge status={i.status} size="xs" />
              <ChevronRight className="hidden size-4 text-slate-300 sm:block" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
