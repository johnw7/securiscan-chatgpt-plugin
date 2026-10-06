import type { Client, Intervention } from "../types";

/**
 * Notifications client (e-mail / SMS / push).
 *
 * Version démo : les notifications sont simulées et journalisées.
 * Version connectée : brancher un fournisseur (Brevo, Resend, Twilio…)
 * via une route API côté serveur — jamais de clé d'API côté navigateur.
 */
export type NotificationEvent = "intervention_scheduled" | "intervention_started" | "intervention_completed";

export interface NotificationService {
  notifyClient(event: NotificationEvent, payload: { client: Client; intervention: Intervention }): Promise<{ channel: string; to: string }>;
}

export class SimulatedNotificationService implements NotificationService {
  async notifyClient(event: NotificationEvent, { client, intervention }: { client: Client; intervention: Intervention }) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[notification simulée] ${event} → ${client.email} (${intervention.id})`);
    }
    return { channel: "e-mail", to: client.email };
  }
}
