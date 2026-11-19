"use client";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import type { ActionResult } from "@/lib/errors";

/** Boutons Accepter / Refuser avec commentaire facultatif (validation client). */
export function RespondButtons({ action, subject }: { action: (input: unknown) => Promise<ActionResult>; subject: string }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"accept" | "refuse" | null>(null);
  const [comment, setComment] = React.useState("");
  const [pending, start] = React.useTransition();
  const submit = () =>
    start(async () => {
      const r = await action({ accept: mode === "accept", comment });
      if (r.ok) {
        toast.success(r.message ?? "Réponse enregistrée");
        setMode(null);
        router.refresh();
      } else toast.error(r.error);
    });
  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setMode("accept")}><Check /> Accepter</Button>
        <Button size="sm" variant="danger" onClick={() => setMode("refuse")}><X /> Refuser</Button>
      </div>
      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)} size="sm" title={mode === "accept" ? "Confirmer l'acceptation" : "Confirmer le refus"} description={subject}>
        <div className="space-y-4">
          <Field id="resp-comment" label="Commentaire (facultatif)">
            <Textarea rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMode(null)}>Annuler</Button>
            <Button variant={mode === "accept" ? "primary" : "danger"} loading={pending} onClick={submit}>{mode === "accept" ? "J'accepte" : "Je refuse"}</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
