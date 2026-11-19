import type { Metadata } from "next";
import { ShieldCheck, UserCheck, UserX } from "lucide-react";
import { ActionButton, InlineSelect } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Notice, PageHeader } from "@/components/ui/misc";
import { changeRole, setMembershipActive } from "@/features/admin/actions";
import { InviteDialog, ResetLinkButton } from "@/features/admin/invite-dialog";
import { getClientOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { ROLE_LABELS, assignableRoles, type Role } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const session = await requireCapability("admin.users");
  const { client } = await searchParams;
  const supabase = await createClient();
  const [{ data }, clients] = await Promise.all([
    supabase.from("memberships").select("id, user_id, role, active, created_at, client_id, clients(name), profiles(full_name, email)").order("created_at"),
    getClientOptions(),
  ]);
  const roles = assignableRoles(session.role);
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs et rôles"
        description="Principe du moindre privilège : chaque compte reçoit uniquement le rôle nécessaire. Les administrateurs doivent activer la double authentification."
        actions={<InviteDialog roles={roles} clients={clients} defaultClient={client} />}
      />
      <div className="mb-6"><Notice tone="info">Super-administrateur : gestion complète, y compris des autres administrateurs. Administrateur : facturation, utilisateurs, organisation. Collaborateur : missions, audits, projets, veille, documents. Client : son seul portail.</Notice></div>
      <Card>
        <CardBody className="p-0">
          <ul className="divide-y divide-border">
            {(data ?? []).map((m) => {
              const p = m.profiles as { full_name: string | null; email: string } | null;
              const self = m.user_id === session.userId;
              const name = p?.full_name || p?.email || "—";
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{name} {self && <Badge tone="gold">vous</Badge>}</p>
                    <p className="truncate text-xs text-muted">{p?.email} · depuis le {formatDate(m.created_at)}{m.role === "client" ? ` · ${(m.clients as { name: string } | null)?.name ?? ""}` : ""}</p>
                  </div>
                  {m.role === "client" || self || !roles.includes(m.role as Role) ? (
                    <Badge tone={m.role === "super_admin" || m.role === "admin" ? "gold" : "neutral"}>{(m.role === "super_admin" || m.role === "admin") && <ShieldCheck className="size-3" />}{ROLE_LABELS[m.role as Role]}</Badge>
                  ) : (
                    <InlineSelect label={`Rôle de ${name}`} value={m.role} options={roles.filter((r) => r !== "client").map((r) => ({ value: r, label: ROLE_LABELS[r] }))} action={changeRole.bind(null, m.id)} />
                  )}
                  <Badge tone={m.active ? "success" : "danger"}>{m.active ? "Actif" : "Désactivé"}</Badge>
                  {!self && (m.role !== "super_admin" || session.role === "super_admin") && (
                    <>
                      <ResetLinkButton membershipId={m.id} name={name} />
                      {m.active ? (
                        <ActionButton variant="ghost" size="icon-sm" aria-label={`Désactiver ${name}`} action={setMembershipActive.bind(null, m.id, false)} confirm={{ title: `Désactiver ${name} ?`, description: "L'accès est immédiatement retiré et toutes ses sessions sont révoquées. L'historique est conservé.", danger: true, confirmLabel: "Désactiver" }}><UserX /></ActionButton>
                      ) : (
                        <ActionButton variant="ghost" size="icon-sm" aria-label={`Réactiver ${name}`} action={setMembershipActive.bind(null, m.id, true)}><UserCheck /></ActionButton>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
