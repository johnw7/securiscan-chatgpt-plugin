"use client";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { publishReport } from "./actions";

/** Sélection des clients autorisés à recevoir un rapport validé. */
export function PublishForm({ reportId, clients, already }: { reportId: string; clients: Array<{ value: string; label: string }>; already: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [filter, setFilter] = React.useState("");
  const [pending, start] = React.useTransition();
  const visible = clients.filter((c) => c.label.toLowerCase().includes(filter.toLowerCase()));
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await publishReport(reportId, { client_ids: selected });
          if (r.ok) {
            toast.success(r.message ?? "Diffusé");
            setSelected([]);
            router.refresh();
          } else toast.error(r.error);
        });
      }}
    >
      <Input type="search" placeholder="Filtrer les clients…" aria-label="Filtrer les clients" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <fieldset className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-border p-3 scrollbar-thin">
        <legend className="sr-only">Clients destinataires</legend>
        {visible.map((c) => (
          <label key={c.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(c.value)}
              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, c.value] : s.filter((x) => x !== c.value)))}
            />
            <span className="flex-1">{c.label}</span>
            {already.includes(c.value) && <span className="text-xs text-success">déjà destinataire</span>}
          </label>
        ))}
      </fieldset>
      <Button type="submit" loading={pending} disabled={!selected.length} className="w-full">
        <Send /> Diffuser à {selected.length} client(s)
      </Button>
    </form>
  );
}
