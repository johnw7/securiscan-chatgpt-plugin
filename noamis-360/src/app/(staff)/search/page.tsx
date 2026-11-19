import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Recherche" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff();
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const supabase = await createClient();
  const { data } = q.length >= 2 ? await supabase.rpc("global_search", { p_query: q }) : { data: [] };
  const groups = new Map<string, NonNullable<typeof data>>();
  for (const r of data ?? []) groups.set(r.kind, [...(groups.get(r.kind) ?? []), r]);
  return (
    <>
      <PageHeader title="Recherche globale" description={q ? `Résultats pour « ${q} » (limités à vos droits d'accès)` : "Saisissez au moins 2 caractères."} />
      {q.length >= 2 && !data?.length ? (
        <EmptyState icon={Search} title="Aucun résultat" description="Essayez un autre terme (nom, référence, numéro de devis…)." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[...groups.entries()].map(([kind, rows]) => (
            <Card key={kind}>
              <CardBody>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold-text">{kind}s</h2>
                <ul className="space-y-2">
                  {rows.map((r) => (
                    <li key={`${kind}-${r.id}`} className="flex items-center gap-2 text-sm">
                      <Link href={r.link} className="flex-1 truncate hover:text-gold-text">{r.title}</Link>
                      {r.subtitle && <Badge>{r.subtitle}</Badge>}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
