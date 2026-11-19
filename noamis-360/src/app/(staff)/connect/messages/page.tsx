import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { markClientThreadRead, sendStaffMessage } from "@/features/connect/actions";
import { MessageThread } from "@/features/connect/thread";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messagerie clients" };

export default async function StaffMessagesPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  await requireCapability("connect.manage");
  const { client } = await searchParams;
  const supabase = await createClient();
  const { data: all } = await supabase.from("messages").select("client_id, from_client, read_by_staff_at, created_at, clients(name)").order("created_at", { ascending: false }).limit(1000);
  const threads = new Map<string, { name: string; last: string; unread: number }>();
  for (const m of all ?? []) {
    const t = threads.get(m.client_id) ?? { name: (m.clients as { name: string } | null)?.name ?? "—", last: m.created_at, unread: 0 };
    if (m.from_client && !m.read_by_staff_at) t.unread += 1;
    threads.set(m.client_id, t);
  }
  const { data: clients } = await supabase.from("memberships").select("client_id, clients(name)").eq("role", "client").eq("active", true);
  for (const c of clients ?? []) if (c.client_id && !threads.has(c.client_id)) threads.set(c.client_id, { name: (c.clients as { name: string } | null)?.name ?? "—", last: "", unread: 0 });
  const selected = client && threads.has(client) ? client : [...threads.keys()][0];
  const { data: messages } = selected
    ? await supabase.from("messages").select("id, body, from_client, created_at, profiles(full_name, email)").eq("client_id", selected).order("created_at").limit(500)
    : { data: [] };
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title="Messagerie clients" description="Échanges sécurisés avec les clients disposant d'un accès au portail." />
      {threads.size ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card>
            <CardBody className="p-2">
              <nav aria-label="Conversations">
                <ul className="space-y-1">
                  {[...threads.entries()].map(([id, t]) => (
                    <li key={id}>
                      <Link href={`?client=${id}`} aria-current={id === selected ? "page" : undefined} className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm", id === selected ? "bg-gold/12" : "hover:bg-surface-2")}>
                        <span className="truncate">{t.name}</span>
                        {t.unread > 0 && <span className="rounded-full bg-gold px-1.5 text-xs font-bold text-on-gold">{t.unread}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </CardBody>
          </Card>
          {selected && (
            <MessageThread
              viewer="staff"
              messages={(messages ?? []).map((m) => ({ id: m.id, body: m.body, from_client: m.from_client, created_at: m.created_at, author: (m.profiles as { full_name: string | null; email: string } | null)?.full_name ?? "—" }))}
              send={async (body: string) => {
                "use server";
                return sendStaffMessage({ client_id: selected, body });
              }}
              onOpen={markClientThreadRead.bind(null, selected)}
            />
          )}
        </div>
      ) : (
        <EmptyState title="Aucune conversation" description="Les conversations apparaissent dès qu'un client dispose d'un accès au portail." />
      )}
    </>
  );
}
