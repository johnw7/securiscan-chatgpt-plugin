import type { AppData } from "../types";
import { DATA_VERSION } from "../data/seed";

/**
 * Persistance des données de démonstration.
 * Version démo : localStorage du navigateur (chaque visiteur a sa propre copie).
 * Version connectée : remplacée par l'API (PostgreSQL via Prisma).
 */
export interface DataPersistence {
  load(): AppData | null;
  save(data: AppData): void;
  clear(): void;
}

const KEY = "edust-intervention:data";

export const localPersistence: DataPersistence = {
  load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AppData;
      return parsed.version === DATA_VERSION ? parsed : null;
    } catch {
      return null;
    }
  },
  save(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Quota dépassé (photos volumineuses) ou stockage indisponible : la démo continue en mémoire.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* stockage indisponible */
    }
  },
};
