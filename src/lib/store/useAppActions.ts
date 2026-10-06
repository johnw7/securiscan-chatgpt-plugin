"use client";

import { useMemo } from "react";
import type { Client, Intervention, InterventionType, Priority, QuoteStatus, CompanySettings } from "../types";
import { DEFAULT_CHECKLISTS } from "../constants";
import { interventionRef } from "../data/seed";
import { nowTime, toISODateTime } from "../dates";
import { services } from "../services";
import { uid } from "../utils";
import { NEW_CLIENT_PREFIX } from "../data/static-ids";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "./AppStore";
import { getClient, nextInterventionNumber } from "./selectors";

export interface NewInterventionInput {
  clientId: string;
  type: InterventionType;
  title: string;
  description: string;
  address: string;
  date: string | null;
  time: string | null;
  technicianId: string | null;
  durationMin: number;
  priority: Priority;
}

export interface NewClientInput {
  name: string;
  sector: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

const AMOUNT_BY_TYPE: Record<InterventionType, number> = { maintenance: 65, installation: 75, depannage: 85, entretien: 60 };

/**
 * Actions métier exposées aux composants.
 * Chaque action met à jour le store, déclenche les effets (notifications,
 * stockage…) via la couche `services`, puis affiche un retour visuel.
 */
export function useAppActions() {
  const { data, dispatch, reset, today } = useStore();
  const toast = useToast();

  return useMemo(() => {
    const find = (id: string) => data.interventions.find((i) => i.id === id);

    return {
      createIntervention(input: NewInterventionInput): string {
        const id = interventionRef(nextInterventionNumber(data));
        const scheduled = Boolean(input.date && input.time && input.technicianId);
        const intervention: Intervention = {
          id,
          ...input,
          status: scheduled ? "PLANIFIEE" : "A_PLANIFIER",
          amount: Math.round((input.durationMin / 60) * AMOUNT_BY_TYPE[input.type] + 60),
          checklist: DEFAULT_CHECKLISTS[input.type].map((label, i) => ({ id: `chk-${id}-${i}`, label, done: false })),
          timeline: [
            { id: uid("tl"), time: nowTime(), label: `Demande enregistrée par ${data.settings.ownerFirstName} ${data.settings.ownerLastName}`, kind: "created" },
            ...(scheduled ? [{ id: uid("tl"), time: nowTime(), label: "Intervention planifiée et technicien notifié", kind: "scheduled" as const }] : []),
          ],
          photos: [],
          report: "",
          signature: null,
          createdAt: toISODateTime(new Date()),
        };
        dispatch({ type: "CREATE_INTERVENTION", intervention });
        const client = getClient(data, input.clientId);
        if (client && scheduled) void services.notifications.notifyClient("intervention_scheduled", { client, intervention });
        toast.success("Intervention créée avec succès", `${id} · ${client?.name ?? ""}${scheduled ? " — technicien notifié" : " — à planifier"}`);
        return id;
      },

      scheduleIntervention(id: string, patch: { date: string; time: string; technicianId: string }) {
        dispatch({ type: "UPDATE_INTERVENTION", id, patch: { ...patch, status: "PLANIFIEE" } });
        toast.success("Intervention planifiée", "Le technicien a reçu la mission sur son application.");
      },

      startIntervention(id: string) {
        const intervention = find(id);
        if (!intervention) return;
        dispatch({ type: "START_INTERVENTION", id, time: nowTime() });
        const client = getClient(data, intervention.clientId);
        if (client && data.settings.notifyClientOnStart) {
          void services.notifications.notifyClient("intervention_started", { client, intervention });
        }
        toast.success("Intervention commencée", data.settings.notifyClientOnStart ? `${client?.name} a été prévenu de votre arrivée.` : undefined);
      },

      toggleChecklist(id: string, itemId: string) {
        dispatch({ type: "TOGGLE_CHECKLIST", id, itemId, time: nowTime() });
      },

      async addPhoto(id: string, file?: File) {
        const intervention = find(id);
        if (!intervention) return;
        const index = intervention.photos.length + 1;
        try {
          const src = file ? (await services.photos.upload(file, { interventionId: id })).url : undefined;
          dispatch({
            type: "ADD_PHOTO",
            id,
            photo: {
              id: uid("pho"),
              label: file ? `Photo ${index}` : `Photo de chantier ${index}`,
              src,
              tone: (["blue", "cyan", "navy", "slate"] as const)[index % 4],
              takenAt: nowTime(),
            },
          });
          toast.success("Photo ajoutée", "Elle sera jointe au rapport d'intervention.");
        } catch (error) {
          toast.info("Photo non ajoutée", error instanceof Error ? error.message : undefined);
        }
      },

      setReport(id: string, report: string) {
        dispatch({ type: "SET_REPORT", id, report });
      },

      async sign(id: string, dataUrl: string, signedBy: string) {
        const signature = await services.signature.capture({ dataUrl, signedBy, interventionId: id });
        dispatch({ type: "SIGN", id, signature, time: nowTime() });
        toast.success("Signature enregistrée", `Rapport signé par ${signedBy}.`);
      },

      clearSignature(id: string) {
        dispatch({ type: "CLEAR_SIGNATURE", id });
      },

      completeIntervention(id: string): boolean {
        const intervention = find(id);
        if (!intervention) return false;
        if (data.settings.requireSignature && !intervention.signature) {
          toast.info("Signature requise", "Faites signer le client avant de terminer l'intervention.");
          return false;
        }
        dispatch({ type: "COMPLETE_INTERVENTION", id, time: nowTime() });
        const client = getClient(data, intervention.clientId);
        if (client && data.settings.notifyClientOnDone) {
          void services.notifications.notifyClient("intervention_completed", { client, intervention });
        }
        if (client && data.settings.sendReportByEmail) {
          void services.email.send({ to: client.email, subject: `Rapport d'intervention ${id}`, body: intervention.report });
        }
        toast.success(
          "Intervention terminée avec succès",
          data.settings.sendReportByEmail ? `Rapport ${id} envoyé à ${client?.contactName}.` : undefined,
        );
        return true;
      },

      cancelIntervention(id: string) {
        dispatch({ type: "CANCEL_INTERVENTION", id, time: nowTime() });
        toast.info("Intervention annulée", id);
      },

      createClient(input: NewClientInput): string {
        // Identifiant séquentiel : la page de la fiche existe aussi en export statique.
        const id = `${NEW_CLIENT_PREFIX}${data.clients.filter((c) => c.id.startsWith(NEW_CLIENT_PREFIX)).length + 1}`;
        const client: Client = { id, ...input, clientSince: today, pastInterventions: 0, revenue: 0 };
        dispatch({ type: "CREATE_CLIENT", client });
        toast.success("Client créé avec succès", input.name);
        return id;
      },

      setQuoteStatus(id: string, status: QuoteStatus) {
        dispatch({ type: "SET_QUOTE_STATUS", id, status });
        toast.success(status === "ACCEPTE" ? "Devis accepté" : status === "REFUSE" ? "Devis marqué comme refusé" : "Devis remis en attente", id);
      },

      updateSettings(patch: Partial<CompanySettings>) {
        dispatch({ type: "UPDATE_SETTINGS", patch });
      },

      resetDemo(scenario: "standard" | "demo" = "standard") {
        reset(scenario);
      },
    };
  }, [data, dispatch, reset, today, toast]);
}
