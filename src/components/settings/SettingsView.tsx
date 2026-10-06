"use client";

import { useState } from "react";
import { Bell, Building2, Database, KeyRound, Mail, PenLine, RotateCcw, Save, ShieldCheck, Smartphone, FileText, HardDrive, Receipt, Webhook } from "lucide-react";
import type { CompanySettings } from "@/lib/types";
import { useStore } from "@/lib/store/AppStore";
import { useAppActions } from "@/lib/store/useAppActions";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-navy">{label}</span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-electric" : "bg-slate-200")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition", checked && "translate-x-5")} />
      </button>
    </label>
  );
}

const ROADMAP = [
  { icon: Database, title: "PostgreSQL + Prisma", text: "Schéma prêt (prisma/schema.prisma), données multi-entreprises." },
  { icon: KeyRound, title: "Authentification", text: "Comptes administrateurs, techniciens et clients avec rôles." },
  { icon: Webhook, title: "API", text: "Routes REST versionnées (/api/interventions) pour intégrations." },
  { icon: Bell, title: "Notifications", text: "E-mail, SMS et push au démarrage et à la clôture." },
  { icon: Mail, title: "E-mails transactionnels", text: "Envoi automatique des rapports, devis et factures." },
  { icon: HardDrive, title: "Stockage photos", text: "Upload sécurisé vers un stockage objet avec URL signées." },
  { icon: FileText, title: "Génération PDF", text: "Rapports et devis générés côté serveur et archivés." },
  { icon: PenLine, title: "Signature électronique", text: "Signature eIDAS via un prestataire certifié." },
  { icon: Receipt, title: "Facturation", text: "Factures, relances et export comptable." },
];

export function SettingsView() {
  const { data } = useStore();
  const actions = useAppActions();
  const toast = useToast();
  const [form, setForm] = useState<CompanySettings>(data.settings);
  const set = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggle = <K extends keyof CompanySettings>(key: K) => (value: boolean) => {
    set(key, value as CompanySettings[K]);
    actions.updateSettings({ [key]: value });
  };

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Paramètres" subtitle="Entreprise, notifications et préférences de l'application." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="animate-fade-up">
            <CardHeader title="Entreprise" icon={<Building2 className="size-[18px]" />} subtitle="Informations reprises sur les rapports, devis et factures" />
            <form
              className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                actions.updateSettings(form);
                toast.success("Paramètres enregistrés");
              }}
            >
              <Field label="Raison sociale" className="sm:col-span-2"><Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} /></Field>
              <Field label="Prénom du dirigeant"><Input value={form.ownerFirstName} onChange={(e) => set("ownerFirstName", e.target.value)} /></Field>
              <Field label="Nom du dirigeant"><Input value={form.ownerLastName} onChange={(e) => set("ownerLastName", e.target.value)} /></Field>
              <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Téléphone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Adresse" className="sm:col-span-2"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
              <Field label="SIRET" className="sm:col-span-2"><Input value={form.siret} onChange={(e) => set("siret", e.target.value)} /></Field>
              <div className="sm:col-span-2">
                <Button type="submit" icon={<Save className="size-4" />}>Enregistrer</Button>
              </div>
            </form>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: "60ms" }}>
            <CardHeader title="Notifications & workflow" icon={<Bell className="size-[18px]" />} />
            <div className="divide-y divide-line px-5 pb-3">
              <Toggle checked={form.notifyClientOnStart} onChange={toggle("notifyClientOnStart")} label="Prévenir le client à l'arrivée du technicien" description="E-mail ou SMS automatique au démarrage de l'intervention." />
              <Toggle checked={form.notifyClientOnDone} onChange={toggle("notifyClientOnDone")} label="Notifier le client à la clôture" description="Message de fin d'intervention avec lien vers le rapport." />
              <Toggle checked={form.sendReportByEmail} onChange={toggle("sendReportByEmail")} label="Envoyer le rapport par e-mail" description="Le rapport signé est joint automatiquement." />
              <Toggle checked={form.requireSignature} onChange={toggle("requireSignature")} label="Signature client obligatoire" description="Une intervention ne peut être terminée sans signature." />
            </div>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <CardHeader title="Données de démonstration" icon={<RotateCcw className="size-[18px]" />} subtitle="Les données sont conservées dans ce navigateur uniquement." />
            <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Remet l&apos;application dans son état initial (interventions, clients, devis, signatures…).</p>
              <Button
                variant="secondary"
                icon={<RotateCcw className="size-4" />}
                onClick={() => {
                  actions.resetDemo("standard");
                  setForm(data.settings);
                  toast.success("Données de démonstration réinitialisées");
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <CardHeader title="Accès & sécurité" icon={<ShieldCheck className="size-[18px]" />} />
            <ul className="space-y-3 px-5 pb-5 text-sm">
              {[
                ["Administrateur", "Alexandre Rousset", "Accès complet"],
                ["Planification", "Sophie Laurent", "Clients, planning, devis"],
                ["Techniciens", "3 comptes", "Application mobile"],
                ["Clients", "Espace client", "Rapports & factures"],
              ].map(([role, who, scope]) => (
                <li key={role} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                  <div>
                    <p className="font-semibold text-navy">{role}</p>
                    <p className="text-xs text-muted">{who} · {scope}</p>
                  </div>
                  <Smartphone className="size-4 text-slate-300" />
                </li>
              ))}
            </ul>
          </Card>
          <Card className="animate-fade-up" style={{ animationDelay: "140ms" }}>
            <CardHeader title="Modules de la version connectée" subtitle="Architecture prête, branchement à la mise en production" />
            <ul className="space-y-3 px-5 pb-5">
              {ROADMAP.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-electric-50 text-electric"><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between gap-2 text-sm font-semibold text-navy">
                      {title} <Badge tone="slate" size="xs" dot={false}>Prévu</Badge>
                    </p>
                    <p className="text-xs text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
