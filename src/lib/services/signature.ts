import type { Signature } from "../types";

/**
 * Signature du rapport par le client.
 *
 * Version démo : signature manuscrite capturée sur canvas, horodatée localement.
 * Version connectée : pour une valeur probante (eIDAS « avancée »), transmettre le
 * rapport PDF à un prestataire de signature électronique (Yousign, Docusign…)
 * et stocker la preuve renvoyée (empreinte, certificat, journal d'audit).
 */
export interface SignatureService {
  capture(params: { dataUrl: string; signedBy: string; interventionId: string }): Promise<Signature>;
}

export class LocalSignatureService implements SignatureService {
  async capture({ dataUrl, signedBy }: { dataUrl: string; signedBy: string; interventionId: string }): Promise<Signature> {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      dataUrl,
      signedBy,
      signedAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    };
  }
}
