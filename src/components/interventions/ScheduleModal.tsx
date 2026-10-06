"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import type { Intervention } from "@/lib/types";
import { useStore } from "@/lib/store/AppStore";
import { useAppActions } from "@/lib/store/useAppActions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function ScheduleModal({ intervention, onClose }: { intervention: Intervention | null; onClose: () => void }) {
  const { data, today } = useStore();
  const actions = useAppActions();
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [tech, setTech] = useState("");

  useEffect(() => {
    if (intervention) {
      setDate(intervention.date ?? today);
      setTime(intervention.time ?? "09:00");
      setTech(intervention.technicianId ?? data.team.find((m) => m.appRole === "technicien")!.id);
    }
  }, [intervention, today, data.team]);

  return (
    <Modal
      open={intervention !== null}
      onClose={onClose}
      title="Planifier l'intervention"
      subtitle={intervention ? `${intervention.id} · ${intervention.title}` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button
            icon={<CalendarCheck className="size-4" />}
            disabled={!date || !time || !tech}
            onClick={() => {
              if (!intervention) return;
              actions.scheduleIntervention(intervention.id, { date, time, technicianId: tech });
              onClose();
            }}
          >
            Planifier
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Heure"><Input type="time" value={time} step={900} onChange={(e) => setTime(e.target.value)} /></Field>
        <Field label="Technicien" className="col-span-2">
          <Select value={tech} onChange={(e) => setTech(e.target.value)}>
            {data.team.filter((m) => m.appRole === "technicien").map((m) => (
              <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
