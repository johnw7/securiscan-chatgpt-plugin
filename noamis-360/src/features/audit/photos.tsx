"use client";
import { Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ACCEPT_PHOTOS } from "@/lib/files-client";

/** Photos d'un constat : prise de vue directe sur mobile (capture), dépôt contrôlé côté serveur. */
export function ObservationPhotos({ auditId, observationId, paths, readOnly }: { auditId: string; observationId: string; paths: string[]; readOnly: boolean }) {
  const router = useRouter();
  const input = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("observationId", observationId);
      body.set("file", file);
      const res = await fetch(`/api/audit/${auditId}/photos`, { method: "POST", body });
      if (res.ok) ok += 1;
      else toast.error(`${file.name} : ${((await res.json().catch(() => ({}))) as { error?: string }).error ?? "échec"}`);
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    if (ok) {
      toast.success(`${ok} photo(s) ajoutée(s)`);
      router.refresh();
    }
  }

  async function remove(path: string) {
    const res = await fetch(`/api/audit/${auditId}/photos?path=${encodeURIComponent(path)}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Photo retirée");
      router.refresh();
    } else toast.error("Suppression impossible");
  }

  return (
    <div className="space-y-2">
      {paths.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {paths.map((p, i) => (
            <li key={p} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/audit/${auditId}/photos?path=${encodeURIComponent(p)}`} alt={`Photo ${i + 1} du constat`} className="size-24 rounded-lg border border-border object-cover" loading="lazy" />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove(p)}
                  className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                  aria-label={`Retirer la photo ${i + 1}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <>
          <input ref={input} type="file" accept={ACCEPT_PHOTOS} capture="environment" multiple className="sr-only" id={`ph-${observationId}`} onChange={(e) => upload(e.target.files)} />
          <Button asChild size="sm" variant="secondary" loading={busy}>
            <label htmlFor={`ph-${observationId}`} className="cursor-pointer">
              <Camera /> {busy ? "Envoi…" : "Ajouter des photos"}
            </label>
          </Button>
        </>
      )}
    </div>
  );
}
