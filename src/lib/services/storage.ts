/**
 * Stockage des photos d'intervention.
 *
 * Version démo : l'image est redimensionnée côté navigateur puis conservée
 * en data URL (aucun envoi réseau).
 * Version connectée : remplacer `LocalPhotoStorage` par une implémentation
 * S3 / Cloudflare R2 / Supabase Storage qui demande une URL d'upload signée
 * à l'API (`POST /api/uploads`), envoie le fichier, puis renvoie l'URL finale.
 */
export interface PhotoStorage {
  upload(file: File, context: { interventionId: string }): Promise<{ url: string }>;
}

const MAX_SIZE = 960;

export class LocalPhotoStorage implements PhotoStorage {
  async upload(file: File): Promise<{ url: string }> {
    if (!file.type.startsWith("image/")) {
      throw new Error("Seules les images sont acceptées.");
    }
    if (file.size > 15 * 1024 * 1024) {
      throw new Error("Image trop volumineuse (15 Mo maximum).");
    }
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return { url: canvas.toDataURL("image/jpeg", 0.72) };
  }
}
