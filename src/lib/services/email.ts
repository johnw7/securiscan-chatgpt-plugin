/**
 * Envoi d'e-mails transactionnels (rapport d'intervention, devis, facture).
 * Version connectée : implémentation serveur (route API) avec un fournisseur SMTP / API.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  attachments?: { filename: string; url: string }[];
}

export interface EmailService {
  send(message: EmailMessage): Promise<{ id: string }>;
}

export class SimulatedEmailService implements EmailService {
  async send(message: EmailMessage) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[e-mail simulé] ${message.subject} → ${message.to}`);
    }
    return { id: `mail-${Date.now()}` };
  }
}
