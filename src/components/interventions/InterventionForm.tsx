"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import type { InterventionType, Priority } from "@/lib/types";
import { PRIORITY_META, TYPE_META } from "@/lib/constants";
import { useStore } from "@/lib/store/AppStore";
import { useAppActions, type NewInterventionInput } from "@/lib/store/useAppActions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DURATIONS = [30, 60, 90, 120, 180, 240, 360, 480];

type FormState = Omit<NewInterventionInput, "date" | "time" | "technicianId"> & { date: string; time: string; technicianId: string };

function emptyForm(today: string): FormState {
  return {
    clientId: "",
    type: "maintenance",
    title: "",
    description: "",
    address: "",
    date: today,
    time: "09:00",
    technicianId: "",
    durationMin: 90,
    priority: "NORMALE",
  };
}

export function InterventionForm({
  open,
  onClose,
  prefill,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: Partial<FormState>;
  onCreated?: (id: string) => void;
}) {
  const { data, today } = useStore();
  const actions = useAppActions();
  const [form, setForm] = useState<FormState>(() => ({ ...emptyForm(today), ...prefill }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm(today), ...prefill });
      setErrors({});
    }
    // Le pré-remplissage n'est appliqué qu'à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onClient = (clientId: string) => {
    const client = data.clients.find((c) => c.id === clientId);
    setForm((f) => ({ ...f, clientId, address: client ? `${client.address}, ${client.city}` : f.address }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.clientId) next.clientId = "Sélectionnez un client.";
    if (!form.title.trim()) next.title = "Indiquez un titre.";
    if (!form.address.trim()) next.address = "Indiquez l'adresse d'intervention.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const id = actions.createIntervention({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date || null,
      time: form.date ? form.time || null : null,
      technicianId: form.technicianId || null,
    });
    onClose();
    onCreated?.(id);
  };

  const technicians = data.team.filter((m) => m.appRole === "technicien");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle intervention"
      subtitle="Le technicien est notifié dès la validation."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="intervention-form" icon={<CheckCircle2 className="size-4" />} className="tracking-wide uppercase">
            Créer l&apos;intervention
          </Button>
        </>
      }
    >
      <form id="intervention-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <Field label="Client" required error={errors.clientId}>
          <Select value={form.clientId} onChange={(e) => onClient(e.target.value)}>
            <option value="">Sélectionner un client…</option>
            {[...data.clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type d'intervention" required>
          <Select value={form.type} onChange={(e) => set("type", e.target.value as InterventionType)}>
            {Object.entries(TYPE_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Titre" required error={errors.title} className="sm:col-span-2">
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex. Dépannage climatisation salle de réunion" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Contexte, symptômes, accès, matériel à prévoir…"
          />
        </Field>
        <Field label="Adresse" required error={errors.address} className="sm:col-span-2">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Adresse du site d'intervention" />
        </Field>
        <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-4">
          <Field label="Date" hint="Vide = à planifier">
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Heure">
            <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} disabled={!form.date} step={900} />
          </Field>
          <Field label="Technicien">
            <Select value={form.technicianId} onChange={(e) => set("technicianId", e.target.value)}>
              <option value="">Non assigné</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Durée estimée">
            <Select value={form.durationMin} onChange={(e) => set("durationMin", Number(e.target.value))}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-[13px] font-medium text-slate-700">Priorité</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => {
              const active = form.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("priority", p)}
                  aria-pressed={active}
                  className={cn(
                    "h-11 rounded-xl border text-xs font-bold tracking-wide uppercase transition",
                    !active && "border-line bg-white text-slate-500 hover:border-slate-300",
                    active && p === "NORMALE" && "border-navy bg-navy text-white",
                    active && p === "IMPORTANTE" && "border-amber-500 bg-amber-50 text-amber-800",
                    active && p === "URGENTE" && "border-rose-500 bg-rose-50 text-rose-700",
                  )}
                >
                  {PRIORITY_META[p].label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
