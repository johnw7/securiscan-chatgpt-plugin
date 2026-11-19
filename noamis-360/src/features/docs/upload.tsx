"use client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/misc";
import { toast } from "@/components/ui/toaster";
import { CONFIDENTIALITY, DOC_CATEGORIES, optionsOf } from "@/lib/labels";
import { ACCEPT_DOCUMENTS, MAX_DOCUMENT_MB } from "@/lib/files-client";

type Opt = Array<{ value: string; label: string }>;

/** Import d'un document (personnel) ou d'une pièce (client). */
export function UploadDialog({
  mode,
  clients = [],
  missions = [],
  defaults = {},
  trigger,
  open: openProp,
}: {
  mode: "staff" | "client";
  clients?: Opt;
  missions?: Opt;
  defaults?: { client_id?: string; mission_id?: string };
  trigger?: React.ReactNode;
  open?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(Boolean(openProp));
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || !file.size) return setError("Sélectionnez un fichier.");
    if (file.size > MAX_DOCUMENT_MB * 1024 * 1024) return setError(`Fichier trop volumineux (${MAX_DOCUMENT_MB} Mo maximum).`);
    const meta =
      mode === "client"
        ? { title: fd.get("title"), description: fd.get("description"), mission_id: fd.get("mission_id") || "" }
        : {
            title: fd.get("title"), category: fd.get("category"), description: fd.get("description"), tags: fd.get("tags"),
            client_id: fd.get("client_id") || "", mission_id: fd.get("mission_id") || "", confidentiality: fd.get("confidentiality"),
            client_visible: fd.get("client_visible") === "on",
          };
    const body = new FormData();
    body.set("file", file);
    body.set("meta", JSON.stringify(meta));
    setPending(true);
    const res = await fetch("/api/documents", { method: "POST", body });
    setPending(false);
    const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok) return setError(json.error ?? "Import impossible.");
    toast.success("Document importé");
    setOpen(false);
    router.push(mode === "client" ? "/portal/documents" : `/docs/${json.id}`);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      size="lg"
      title={mode === "client" ? "Déposer une pièce" : "Importer un document"}
      description={`PDF, images, Word, Excel, PowerPoint, texte — ${MAX_DOCUMENT_MB} Mo maximum. Les fichiers sont contrôlés puis stockés dans un espace privé.`}
      trigger={trigger ?? <Button><Upload /> {mode === "client" ? "Déposer une pièce" : "Importer"}</Button>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field id="up-file" label="Fichier" required>
          <Input name="file" type="file" accept={ACCEPT_DOCUMENTS} required className="py-2" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="up-title" label="Titre" required className="sm:col-span-2">
            <Input name="title" required maxLength={300} />
          </Field>
          {mode === "staff" && (
            <>
              <Field id="up-category" label="Catégorie" required>
                <Select name="category" options={optionsOf(DOC_CATEGORIES).filter((o) => o.value !== "piece_client")} defaultValue="livrable" />
              </Field>
              <Field id="up-confidentiality" label="Confidentialité" required>
                <Select name="confidentiality" options={optionsOf(CONFIDENTIALITY)} defaultValue="interne" />
              </Field>
              <Field id="up-client" label="Client">
                <Select name="client_id" options={clients} placeholder="—" defaultValue={defaults.client_id ?? ""} />
              </Field>
            </>
          )}
          <Field id="up-mission" label="Mission">
            <Select name="mission_id" options={missions} placeholder="—" defaultValue={defaults.mission_id ?? ""} />
          </Field>
          {mode === "staff" && (
            <Field id="up-tags" label="Mots-clés (séparés par des virgules)" className="sm:col-span-2">
              <Input name="tags" />
            </Field>
          )}
          <Field id="up-description" label="Description" className="sm:col-span-2">
            <Textarea name="description" rows={2} maxLength={2000} />
          </Field>
        </div>
        {mode === "staff" && (
          <label className="flex items-start gap-2 text-sm">
            <Checkbox name="client_visible" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="mt-0.5" />
            <span>
              Visible dans le portail du client
              <span className="block text-xs text-muted">Exige un client et la confidentialité « Partagé avec le client ».</span>
            </span>
          </label>
        )}
        {error && <Notice tone="danger">{error}</Notice>}
        <div className="flex justify-end">
          <Button type="submit" loading={pending}><Upload /> Importer</Button>
        </div>
      </form>
    </Dialog>
  );
}
