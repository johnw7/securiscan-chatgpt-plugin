"use client";

/* eslint-disable @next/next/no-img-element -- images locales (data URL) : next/image n'apporte rien ici. */
import { useRef, useState } from "react";
import { Camera, ImageIcon, ImagePlus, Loader2 } from "lucide-react";
import type { Intervention, Photo } from "@/lib/types";
import { useAppActions } from "@/lib/store/useAppActions";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const TONE_BG: Record<NonNullable<Photo["tone"]>, string> = {
  blue: "from-electric/90 to-[#0a3fb8]",
  cyan: "from-[#0891b2] to-[#0b58ff]",
  navy: "from-navy-700 to-navy",
  slate: "from-slate-500 to-slate-700",
};

export function PhotoTile({ photo, onClick, className }: { photo: Photo; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 text-left ring-1 ring-black/5 transition hover:shadow-card-hover",
        className,
      )}
    >
      {photo.src ? (
        <img src={photo.src} alt={photo.label} className="size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
      ) : (
        <span className={cn("flex size-full items-center justify-center bg-gradient-to-br", TONE_BG[photo.tone ?? "blue"])}>
          <span
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "linear-gradient(135deg, rgba(255,255,255,.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.25) 50%, rgba(255,255,255,.25) 75%, transparent 75%)", backgroundSize: "18px 18px" }}
          />
          <ImageIcon className="relative size-7 text-white/80" />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent px-2.5 pt-6 pb-2">
        <span className="truncate text-[11px] font-semibold text-white">{photo.label}</span>
        <span className="tabular shrink-0 text-[10px] text-white/80">{photo.takenAt}</span>
      </span>
    </button>
  );
}

export function PhotoGallery({ intervention, readOnly, columns = 4 }: { intervention: Intervention; readOnly?: boolean; columns?: 2 | 3 | 4 }) {
  const actions = useAppActions();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    await actions.addPhoto(intervention.id, file);
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div>
      <div className={cn("grid gap-3", columns === 2 && "grid-cols-2", columns === 3 && "grid-cols-2 sm:grid-cols-3", columns === 4 && "grid-cols-2 sm:grid-cols-4")}>
        {intervention.photos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} onClick={() => setPreview(photo)} className="animate-scale-in" />
        ))}
        {!readOnly && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 text-slate-500 transition hover:border-electric/50 hover:bg-electric-50/50 hover:text-electric"
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            <span className="text-xs font-semibold">+ Ajouter une photo</span>
          </button>
        )}
      </div>
      {!readOnly && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Camera className="size-3.5" /> Sur smartphone, l&apos;appareil photo s&apos;ouvre directement.
          </span>
          <button type="button" onClick={() => actions.addPhoto(intervention.id)} className="font-semibold text-electric hover:underline">
            Ajouter une photo d&apos;exemple
          </button>
        </div>
      )}
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      <Modal open={preview !== null} onClose={() => setPreview(null)} title={preview?.label ?? ""} subtitle={preview ? `${intervention.id} · prise à ${preview.takenAt}` : undefined} size="lg">
        {preview && <PhotoTile photo={preview} className="pointer-events-none" />}
      </Modal>
    </div>
  );
}
