"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useAppActions, type NewClientInput } from "@/lib/store/useAppActions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const SECTORS = [
  "Bureaux & tertiaire", "Commerce", "Restauration", "Hôtellerie", "Santé", "Copropriété",
  "Industrie", "Artisanat", "Enseignement", "Logistique & entreposage", "Particulier", "Autre",
];

const EMPTY: NewClientInput = { name: "", sector: SECTORS[0], contactName: "", contactRole: "", phone: "", email: "", address: "", city: "" };

export function ClientForm({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const actions = useAppActions();
  const [form, setForm] = useState<NewClientInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof NewClientInput, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
    }
  }, [open]);

  const set = (key: keyof NewClientInput, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Le nom du client est obligatoire.";
    if (!form.contactName.trim()) next.contactName = "Indiquez un contact.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Adresse e-mail invalide.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const id = actions.createClient({ ...form, name: form.name.trim(), contactName: form.contactName.trim() });
    onClose();
    onCreated?.(id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouveau client"
      subtitle="Les informations pourront être complétées depuis la fiche client."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="client-form" icon={<UserPlus className="size-4" />}>Créer le client</Button>
        </>
      }
    >
      <form id="client-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <Field label="Raison sociale" required error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Boulangerie du Centre" autoFocus />
        </Field>
        <Field label="Secteur d'activité">
          <Select value={form.sector} onChange={(e) => set("sector", e.target.value)}>
            {SECTORS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Contact principal" required error={errors.contactName}>
          <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Prénom Nom" />
        </Field>
        <Field label="Fonction">
          <Input value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} placeholder="Ex. Gérant" />
        </Field>
        <Field label="Téléphone">
          <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01 99 00 00 00" />
        </Field>
        <Field label="E-mail" error={errors.email} className="sm:col-span-2">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contact@entreprise.fr" />
        </Field>
        <Field label="Adresse">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="N° et rue" />
        </Field>
        <Field label="Code postal et ville">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="69000 Lyon" />
        </Field>
      </form>
    </Modal>
  );
}
