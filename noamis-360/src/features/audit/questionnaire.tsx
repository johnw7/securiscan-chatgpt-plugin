"use client";
import { CheckCircle2, CloudOff, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Notice, Progress } from "@/components/ui/misc";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { saveAnswers } from "./actions";
import { CONFORMITY_LABELS, conformityByCategory, type Answer, type Conformity, type Question } from "./scoring";

type SaveState = "saved" | "dirty" | "saving" | "offline" | "conflict" | "error";
type LocalDraft = { version: number; answers: Record<string, Answer>; savedAt: string };

const OPTIONS: Conformity[] = ["conforme", "partiel", "non_conforme", "na"];
const TONE: Record<Conformity, string> = {
  conforme: "data-[on=true]:bg-success/20 data-[on=true]:border-success data-[on=true]:text-success",
  partiel: "data-[on=true]:bg-warning/20 data-[on=true]:border-warning data-[on=true]:text-warning",
  non_conforme: "data-[on=true]:bg-danger/20 data-[on=true]:border-danger data-[on=true]:text-danger",
  na: "data-[on=true]:bg-surface-3 data-[on=true]:border-border-strong data-[on=true]:text-foreground",
};

/**
 * Questionnaire d'audit terrain.
 * Fiabilité : chaque saisie est écrite immédiatement dans le stockage local du
 * navigateur (brouillon de secours, y compris hors connexion), puis envoyée au
 * serveur après 1,5 s d'inactivité avec un numéro de version (aucune écrasement
 * silencieux en cas d'édition concurrente).
 */
export function Questionnaire({
  auditId,
  questions,
  categories,
  initialAnswers,
  initialVersion,
  readOnly,
}: {
  auditId: string;
  questions: Question[];
  categories: Array<{ key: string; label: string }>;
  initialAnswers: Record<string, Answer>;
  initialVersion: number;
  readOnly: boolean;
}) {
  const storageKey = `noamis-audit-draft:${auditId}`;
  const [answers, setAnswers] = React.useState<Record<string, Answer>>(initialAnswers);
  const [state, setState] = React.useState<SaveState>("saved");
  const [restorable, setRestorable] = React.useState<LocalDraft | null>(null);
  const version = React.useRef(initialVersion);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = React.useRef(answers);
  React.useEffect(() => {
    latest.current = answers;
  }, [answers]);

  // Brouillon local plus récent que la version serveur ? On propose la restauration.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as LocalDraft;
      // Lecture d'un système externe (stockage local) indisponible au rendu serveur.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (JSON.stringify(draft.answers) !== JSON.stringify(initialAnswers)) setRestorable(draft);
      else localStorage.removeItem(storageKey);
    } catch {
      /* stockage indisponible : la sauvegarde serveur reste active */
    }
  }, [storageKey, initialAnswers]);

  const persistLocal = React.useCallback(
    (next: Record<string, Answer>) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ version: version.current, answers: next, savedAt: new Date().toISOString() }));
      } catch {
        /* quota ou mode privé */
      }
    },
    [storageKey],
  );

  const flush = React.useCallback(async () => {
    if (readOnly) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setState("offline");
      return;
    }
    setState("saving");
    const result = await saveAnswers({ auditId, version: version.current, answers: latest.current });
    if (result.ok) {
      version.current = (result.data as { version: number }).version;
      setState("saved");
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    } else if (result.error.startsWith("CONFLICT:")) {
      setState("conflict");
    } else {
      setState("error");
      toast.error(result.error);
    }
  }, [auditId, readOnly, storageKey]);

  const schedule = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 1500);
  }, [flush]);

  React.useEffect(() => {
    const online = () => {
      if (state === "offline" || state === "dirty") void flush();
    };
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (state === "dirty" || state === "saving") e.preventDefault();
    };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [flush, state]);

  const update = (id: string, patch: Partial<Answer>) => {
    if (readOnly) return;
    setAnswers((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      persistLocal(next);
      return next;
    });
    setState("dirty");
    schedule();
  };

  const stats = conformityByCategory(questions, answers);
  const answered = questions.filter((q) => answers[q.id]?.value).length;

  return (
    <div className="space-y-5">
      <div className="sticky top-16 z-10 -mx-1 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="min-w-48 flex-1">
          <Progress value={(answered / Math.max(questions.length, 1)) * 100} label="Questions renseignées" />
          <p className="mt-1 text-xs text-muted">
            {answered} / {questions.length} questions renseignées
          </p>
        </div>
        <SaveIndicator state={state} />
        {!readOnly && (state === "dirty" || state === "error" || state === "offline") && (
          <Button size="sm" variant="secondary" onClick={flush}>
            Enregistrer maintenant
          </Button>
        )}
      </div>

      {readOnly && <Notice tone="gold">Audit validé ou archivé : le questionnaire est en lecture seule.</Notice>}
      {state === "conflict" && (
        <Notice tone="danger" title="Modification concurrente détectée">
          Une autre session a enregistré ce questionnaire. Votre saisie est conservée en brouillon local. Rechargez la page pour récupérer la version serveur,
          puis restaurez votre brouillon si nécessaire.
        </Notice>
      )}
      {restorable && !readOnly && (
        <Notice tone="warning" title="Brouillon local non synchronisé">
          <span>Un brouillon enregistré sur cet appareil le {new Date(restorable.savedAt).toLocaleString("fr-FR")} n&apos;a pas été envoyé au serveur.</span>
          <span className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setAnswers(restorable.answers);
                setRestorable(null);
                setState("dirty");
                schedule();
              }}
            >
              <RotateCcw /> Restaurer ce brouillon
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                localStorage.removeItem(storageKey);
                setRestorable(null);
              }}
            >
              Ignorer
            </Button>
          </span>
        </Notice>
      )}

      {categories.map((cat) => {
        const qs = questions.filter((q) => q.category === cat.key);
        if (!qs.length) return null;
        const s = stats[cat.key];
        return (
          <details key={cat.key} open className="group rounded-xl border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
              <h3 className="flex-1 font-semibold">{cat.label}</h3>
              <span className="text-xs text-muted">
                {s?.answered ?? 0}/{s?.total ?? 0}
              </span>
              {s?.rate !== null && s?.rate !== undefined && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", s.rate >= 75 ? "bg-success/15 text-success" : s.rate >= 40 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger")}>
                  {s.rate} % conforme
                </span>
              )}
            </summary>
            <ol className="divide-y divide-border border-t border-border">
              {qs.map((q, i) => {
                const a = answers[q.id] ?? {};
                return (
                  <li key={q.id} className="space-y-3 px-5 py-4">
                    <p className="text-sm">
                      <span className="mr-2 text-muted">{i + 1}.</span>
                      {q.label}
                    </p>
                    {q.guidance && <p className="text-xs text-muted">{q.guidance}</p>}
                    <div role="radiogroup" aria-label={q.label} className="flex flex-wrap gap-2">
                      {OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={a.value === opt}
                          data-on={a.value === opt}
                          disabled={readOnly}
                          onClick={() => update(q.id, { value: opt })}
                          className={cn("rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed", TONE[opt])}
                        >
                          {CONFORMITY_LABELS[opt]}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      rows={2}
                      aria-label={`Observation : ${q.label}`}
                      placeholder="Observation / précision (facultatif)"
                      value={a.comment ?? ""}
                      disabled={readOnly}
                      maxLength={2000}
                      onChange={(e) => update(q.id, { comment: e.target.value })}
                    />
                  </li>
                );
              })}
            </ol>
          </details>
        );
      })}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { icon: React.ReactNode; label: string; cls: string }> = {
    saved: { icon: <CheckCircle2 className="size-4" />, label: "Enregistré sur le serveur", cls: "text-success" },
    dirty: { icon: <Loader2 className="size-4" />, label: "Brouillon local — synchronisation…", cls: "text-muted" },
    saving: { icon: <Loader2 className="size-4 animate-spin" />, label: "Enregistrement…", cls: "text-muted" },
    offline: { icon: <CloudOff className="size-4" />, label: "Hors connexion — brouillon conservé sur l'appareil", cls: "text-warning" },
    conflict: { icon: <TriangleAlert className="size-4" />, label: "Conflit de version", cls: "text-danger" },
    error: { icon: <TriangleAlert className="size-4" />, label: "Échec de l'enregistrement — brouillon local conservé", cls: "text-danger" },
  };
  const s = map[state];
  return (
    <p role="status" aria-live="polite" className={cn("flex items-center gap-1.5 text-xs", s.cls)}>
      {s.icon}
      {s.label}
    </p>
  );
}
