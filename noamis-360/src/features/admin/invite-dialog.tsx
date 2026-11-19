"use client";
import { Copy, KeyRound, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Notice } from "@/components/ui/misc";
import { toast } from "@/components/ui/toaster";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { inviteUser, resetLink } from "./actions";

function LinkResult({ link }: { link: string }) {
  return (
    <div className="space-y-3">
      <Notice tone="gold" title="Lien d'activation (usage unique, 1 heure)">Transmettez-le à la personne par un canal sûr. Elle définira son mot de passe ; les administrateurs activeront ensuite la double authentification.</Notice>
      <div className="flex gap-2">
        <Input readOnly value={link} aria-label="Lien d'activation" onFocus={(e) => e.currentTarget.select()} />
        <Button type="button" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(link); toast.success("Lien copié"); }}><Copy /> Copier</Button>
      </div>
    </div>
  );
}

export function InviteDialog({ roles, clients, defaultClient }: { roles: Role[]; clients: Array<{ value: string; label: string }>; defaultClient?: string }) {
  const router = useRouter();
  const [link, setLink] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<Role>(defaultClient ? "client" : "collaborator");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <Dialog
      title="Inviter un utilisateur"
      description="Création du compte et du rôle. Aucun mot de passe n'est défini par l'administrateur."
      trigger={<Button><UserPlus /> Inviter</Button>}
      onOpenChange={(o) => { if (!o) { setLink(null); setError(null); } }}
      open={defaultClient ? undefined : undefined}
    >
      {link ? <LinkResult link={link} /> : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const r = await inviteUser({ email: fd.get("email"), full_name: fd.get("full_name"), role: fd.get("role"), client_id: fd.get("client_id") ?? "" });
              if (r.ok) { setLink((r.data as { link: string }).link); router.refresh(); }
              else setError(r.fieldErrors ? Object.values(r.fieldErrors).flat()[0] ?? r.error : r.error);
            });
          }}
        >
          <Field id="inv-name" label="Nom complet" required><Input name="full_name" required maxLength={120} /></Field>
          <Field id="inv-email" label="Adresse e-mail" required><Input name="email" type="email" required maxLength={254} /></Field>
          <Field id="inv-role" label="Rôle" required>
            <Select name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
          </Field>
          {role === "client" && (
            <Field id="inv-client" label="Fiche client rattachée" required hint="L'utilisateur ne verra que les données de ce client.">
              <Select name="client_id" options={clients} defaultValue={defaultClient ?? ""} placeholder="— Sélectionner —" required />
            </Field>
          )}
          {error && <Notice tone="danger">{error}</Notice>}
          <div className="flex justify-end"><Button type="submit" loading={pending}>Créer le compte</Button></div>
        </form>
      )}
    </Dialog>
  );
}

export function ResetLinkButton({ membershipId, name }: { membershipId: string; name: string }) {
  const [link, setLink] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <Dialog
      title="Réinitialisation du mot de passe"
      description={name}
      size="md"
      onOpenChange={(o) => !o && setLink(null)}
      trigger={<Button variant="ghost" size="icon-sm" aria-label={`Lien de réinitialisation pour ${name}`}><KeyRound /></Button>}
    >
      {link ? <LinkResult link={link} /> : (
        <div className="space-y-4">
          <p className="text-sm text-muted">Génère un lien à usage unique permettant à la personne de définir un nouveau mot de passe.</p>
          <Button loading={pending} onClick={() => start(async () => { const r = await resetLink(membershipId); if (r.ok) setLink((r.data as { link: string }).link); else toast.error(r.error); })}>Générer le lien</Button>
        </div>
      )}
    </Dialog>
  );
}
