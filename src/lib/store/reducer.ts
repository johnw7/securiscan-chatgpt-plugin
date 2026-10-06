import type {
  Activity,
  ActivityKind,
  AppData,
  Client,
  CompanySettings,
  Intervention,
  Photo,
  QuoteStatus,
  Signature,
  TimelineEvent,
  TimelineKind,
} from "../types";
import { toISODateTime } from "../dates";
import { uid } from "../utils";

/**
 * Actions métier. Le reducer est pur : il pourra être remplacé par des
 * appels API (Server Actions / routes REST) sans changer les composants,
 * qui ne manipulent que les fonctions exposées par `useAppActions()`.
 */
export type Action =
  | { type: "RESET"; data: AppData }
  | { type: "CREATE_INTERVENTION"; intervention: Intervention }
  | { type: "UPDATE_INTERVENTION"; id: string; patch: Partial<Intervention> }
  | { type: "START_INTERVENTION"; id: string; time: string }
  | { type: "TOGGLE_CHECKLIST"; id: string; itemId: string; time: string }
  | { type: "ADD_PHOTO"; id: string; photo: Photo }
  | { type: "SET_REPORT"; id: string; report: string }
  | { type: "SIGN"; id: string; signature: Signature; time: string }
  | { type: "CLEAR_SIGNATURE"; id: string }
  | { type: "COMPLETE_INTERVENTION"; id: string; time: string }
  | { type: "CANCEL_INTERVENTION"; id: string; time: string }
  | { type: "CREATE_CLIENT"; client: Client }
  | { type: "SET_QUOTE_STATUS"; id: string; status: QuoteStatus }
  | { type: "UPDATE_SETTINGS"; patch: Partial<CompanySettings> };

function activity(kind: ActivityKind, text: string, href?: string): Activity {
  return { id: uid("act"), kind, text, at: toISODateTime(new Date()), href };
}

function event(kind: TimelineKind, time: string, label: string): TimelineEvent {
  return { id: uid("tl"), kind, time, label };
}

function updateIntervention(data: AppData, id: string, fn: (i: Intervention) => Intervention): AppData {
  return { ...data, interventions: data.interventions.map((i) => (i.id === id ? fn(i) : i)) };
}

function clientName(data: AppData, clientId: string) {
  return data.clients.find((c) => c.id === clientId)?.name ?? "";
}

function prepend(data: AppData, ...items: Activity[]): AppData {
  return { ...data, activities: [...items, ...data.activities].slice(0, 40) };
}

export function reducer(data: AppData, action: Action): AppData {
  switch (action.type) {
    case "RESET":
      return action.data;

    case "CREATE_INTERVENTION": {
      const next = { ...data, interventions: [action.intervention, ...data.interventions] };
      return prepend(
        next,
        activity(
          "intervention_created",
          `Intervention ${action.intervention.id} créée — ${clientName(data, action.intervention.clientId)}`,
          `/interventions/${action.intervention.id}`,
        ),
      );
    }

    case "UPDATE_INTERVENTION":
      return updateIntervention(data, action.id, (i) => ({ ...i, ...action.patch }));

    case "START_INTERVENTION": {
      const target = data.interventions.find((i) => i.id === action.id);
      if (!target || target.status === "EN_COURS" || target.status === "TERMINEE") return data;
      const next = updateIntervention(data, action.id, (i) => ({
        ...i,
        status: "EN_COURS",
        timeline: [
          ...i.timeline,
          event("arrived", action.time, "Technicien arrivé sur site"),
          event("started", action.time, "Intervention commencée"),
        ],
      }));
      return prepend(
        next,
        activity("intervention_started", `Intervention ${action.id} commencée — ${clientName(data, target.clientId)}`, `/interventions/${action.id}`),
      );
    }

    case "TOGGLE_CHECKLIST":
      return updateIntervention(data, action.id, (i) => {
        const checklist = i.checklist.map((c) => (c.id === action.itemId ? { ...c, done: !c.done } : c));
        const item = checklist.find((c) => c.id === action.itemId);
        const timeline =
          item?.done && item.label.toLowerCase().startsWith("diagnostic")
            ? [...i.timeline, event("diagnostic", action.time, "Diagnostic effectué")]
            : i.timeline;
        return { ...i, checklist, timeline };
      });

    case "ADD_PHOTO": {
      const target = data.interventions.find((i) => i.id === action.id);
      if (!target) return data;
      const next = updateIntervention(data, action.id, (i) => ({
        ...i,
        photos: [...i.photos, action.photo],
        timeline: [...i.timeline, event("photo", action.photo.takenAt, `Photo ajoutée : ${action.photo.label}`)],
      }));
      return prepend(next, activity("photos", `1 photo ajoutée — ${action.id} · ${clientName(data, target.clientId)}`, `/interventions/${action.id}`));
    }

    case "SET_REPORT":
      return updateIntervention(data, action.id, (i) => ({ ...i, report: action.report }));

    case "SIGN": {
      const target = data.interventions.find((i) => i.id === action.id);
      if (!target) return data;
      const next = updateIntervention(data, action.id, (i) => ({
        ...i,
        signature: action.signature,
        timeline: [...i.timeline, event("signature", action.time, `Rapport signé par ${action.signature.signedBy}`)],
      }));
      return prepend(next, activity("signature", `Rapport signé par le client — ${clientName(data, target.clientId)}`, `/interventions/${action.id}`));
    }

    case "CLEAR_SIGNATURE":
      return updateIntervention(data, action.id, (i) => ({ ...i, signature: null }));

    case "COMPLETE_INTERVENTION": {
      const target = data.interventions.find((i) => i.id === action.id);
      if (!target || target.status === "TERMINEE") return data;
      const next = updateIntervention(data, action.id, (i) => ({
        ...i,
        status: "TERMINEE",
        timeline: [...i.timeline, event("completed", action.time, "Intervention terminée")],
      }));
      return prepend(next, activity("intervention_done", `Intervention ${action.id} terminée — ${clientName(data, target.clientId)}`, `/interventions/${action.id}`));
    }

    case "CANCEL_INTERVENTION":
      return updateIntervention(data, action.id, (i) => ({
        ...i,
        status: "ANNULEE",
        timeline: [...i.timeline, event("cancelled", action.time, "Intervention annulée")],
      }));

    case "CREATE_CLIENT":
      return prepend(
        { ...data, clients: [action.client, ...data.clients] },
        activity("client_new", `Nouveau client ajouté — ${action.client.name}`, `/clients/${action.client.id}`),
      );

    case "SET_QUOTE_STATUS": {
      const quote = data.quotes.find((q) => q.id === action.id);
      if (!quote) return data;
      const next = { ...data, quotes: data.quotes.map((q) => (q.id === action.id ? { ...q, status: action.status } : q)) };
      if (action.status === "EN_ATTENTE") return next;
      const accepted = action.status === "ACCEPTE";
      return prepend(
        next,
        activity(
          accepted ? "quote_accepted" : "quote_refused",
          `Devis ${action.id} ${accepted ? "accepté" : "refusé"} — ${clientName(data, quote.clientId)}`,
          "/devis",
        ),
      );
    }

    case "UPDATE_SETTINGS":
      return { ...data, settings: { ...data.settings, ...action.patch } };

    default:
      return data;
  }
}
