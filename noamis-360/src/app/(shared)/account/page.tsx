import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/app/(auth)/auth-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EntityForm } from "@/components/ui/entity-form";
import { Notice, PageHeader } from "@/components/ui/misc";
import { saveProfile } from "@/features/admin/actions";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABELS, requiresMfa } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const session = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, phone, job_title, email").eq("id", session.userId).single();
  const mandatory = requiresMfa(session.role);
  return (
    <>
      <PageHeader title="Mon compte" description={`${session.email} · ${ROLE_LABELS[session.role]}`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Profil" />
          <CardBody>
            <EntityForm schema="profile" fields={[{ name: "full_name", label: "Nom complet", required: true, wide: true }, { name: "job_title", label: "Fonction" }, { name: "phone", label: "Téléphone", type: "tel" }]} defaultValues={profile ?? {}} action={saveProfile} />
          </CardBody>
        </Card>
        <div className="space-y-6" id="securite">
          <Card>
            <CardHeader title="Double authentification (TOTP)" action={session.mfaEnrolled ? <Badge tone="success"><ShieldCheck className="size-3" /> Activée</Badge> : <Badge tone={mandatory ? "danger" : "warning"}><ShieldAlert className="size-3" /> Non activée</Badge>} />
            <CardBody className="space-y-3 text-sm">
              <p className="text-muted">{mandatory ? "Obligatoire pour votre rôle : chaque connexion exige un code de votre application d'authentification." : "Recommandée : elle protège votre compte même si votre mot de passe est compromis."}</p>
              {!session.mfaEnrolled && <Button asChild><Link href="/mfa/enroll">Activer la double authentification</Link></Button>}
              {session.mfaEnrolled && <Notice tone="info">Perte de l&apos;appareil : contactez un super-administrateur, qui peut réinitialiser votre second facteur depuis la console Supabase (procédure dans docs/OPERATIONS.md).</Notice>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Changer de mot de passe" />
            <CardBody><ResetPasswordForm /></CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
