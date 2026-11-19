import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import type { ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDateTime } from "@/lib/utils";

export async function NotificationsList({ userId, markAll }: { userId: string; markAll: () => Promise<ActionResult> }) {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return (
    <Card>
      <CardHeader
        title={`${unread} non lue(s)`}
        action={unread > 0 && <ActionButton size="sm" variant="secondary" action={markAll}><CheckCheck /> Tout marquer comme lu</ActionButton>}
      />
      <CardBody className="p-0">
        {data?.length ? (
          <ul className="divide-y divide-border">
            {data.map((n) => (
              <li key={n.id} className={cn("flex items-start gap-3 px-5 py-3", !n.read_at && "bg-gold/5")}>
                <Bell className={cn("mt-0.5 size-4 shrink-0", n.read_at ? "text-muted" : "text-gold")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {n.link ? <Link href={n.link} className="hover:text-gold-text">{n.title}</Link> : n.title}
                    {!n.read_at && <span className="sr-only"> (non lue)</span>}
                  </p>
                  {n.body && <p className="truncate text-sm text-muted">{n.body}</p>}
                </div>
                <time className="shrink-0 text-xs text-muted" dateTime={n.created_at}>{formatDateTime(n.created_at)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5"><EmptyState icon={Bell} title="Aucune notification" /></div>
        )}
      </CardBody>
    </Card>
  );
}
