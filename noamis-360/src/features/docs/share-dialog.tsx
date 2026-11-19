"use client";
import { Copy, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Notice } from "@/components/ui/misc";
import { toast } from "@/components/ui/toaster";
import { createShare } from "./actions";

const DURATIONS = [
  { value: "1", label: "1 heure" },
  { value: "24", label: "24 heures" },
  { value: "72", label: "3 jours" },
  { value: "168", label: "7 jours (maximum)" },
];

export function ShareDialog({ documentId, disabled }: { documentId: string; disabled?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <Dialog
      title="Lien de partage temporaire"
      description="Pour transmettre un document à un tiers (prestataire, partenaire). Le lien expire automatiquement ; les rapports de sûreté ne sont jamais partageables."
      trigger={<Button size="sm" variant="secondary" disabled={disabled}><Link2 /> Créer un lien</Button>}
      onOpenChange={(o) => !o && setUrl(null)}
    >
      {url ? (
        <div className="space-y-3">
          <Notice tone="gold" title="Lien créé">Copiez-le maintenant : pour des raisons de sécurité, il ne pourra plus être affiché.</Notice>
          <div className="flex gap-2">
            <Input readOnly value={url} aria-label="Lien de partage" onFocus={(e) => e.currentTarget.select()} />
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                toast.success("Lien copié");
              }}
            >
              <Copy /> Copier
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const r = await createShare(documentId, Object.fromEntries(fd));
              if (r.ok && r.data && "url" in r.data) {
                setUrl(String((r.data as { url: string }).url));
                router.refresh();
              } else if (!r.ok) toast.error(r.error);
            });
          }}
        >
          <Field id="sh-recipient" label="Destinataire (pour mémoire)">
            <Input name="recipient" maxLength={200} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="sh-hours" label="Validité" required>
              <Select name="hours" options={DURATIONS} defaultValue="72" />
            </Field>
            <Field id="sh-max" label="Téléchargements maximum" required>
              <Input name="max_downloads" type="number" min={1} max={50} defaultValue={3} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>Générer le lien</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

/** Dépôt d'une nouvelle version. */
export function NewVersionButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const input = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  return (
    <>
      <input
        ref={input}
        type="file"
        className="sr-only"
        id={`nv-${documentId}`}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          const body = new FormData();
          body.set("file", file);
          const res = await fetch(`/api/documents/${documentId}/versions`, { method: "POST", body });
          setBusy(false);
          e.target.value = "";
          const json = (await res.json().catch(() => ({}))) as { version?: number; error?: string };
          if (res.ok) {
            toast.success(`Version ${json.version} enregistrée`);
            router.refresh();
          } else toast.error(json.error ?? "Échec");
        }}
      />
      <Button asChild size="sm" loading={busy}>
        <label htmlFor={`nv-${documentId}`} className="cursor-pointer">{busy ? "Envoi…" : "Nouvelle version"}</label>
      </Button>
    </>
  );
}
