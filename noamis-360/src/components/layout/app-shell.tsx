import Link from "next/link";
import { Bell, Search } from "lucide-react";
import type { SessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";

async function unreadCount(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function AppShell({ session, children }: { session: SessionContext; children: React.ReactNode }) {
  const unread = await unreadCount(session.userId);
  const isClient = session.role === "client";
  return (
    <div className="min-h-dvh">
      <Sidebar role={session.role} organizationName={session.organizationName} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 pl-16 backdrop-blur lg:px-8 no-print">
          {!isClient ? (
            <form action="/search" role="search" className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <label htmlFor="global-search" className="sr-only">
                Recherche globale
              </label>
              <input
                id="global-search"
                name="q"
                type="search"
                minLength={2}
                placeholder="Rechercher un client, une mission, un document…"
                className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted/70 focus-visible:border-gold"
              />
            </form>
          ) : (
            <div className="flex-1" />
          )}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={isClient ? "/portal/notifications" : "/notifications"}
              className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-foreground"
              aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-on-gold">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <UserMenu name={session.fullName} email={session.email} role={session.role} mfa={session.aal === "aal2"} />
          </div>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
