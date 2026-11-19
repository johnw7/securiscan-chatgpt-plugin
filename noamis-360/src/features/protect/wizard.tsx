"use client";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Download, Home, Store } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { Notice, Progress } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { attachProtectContact, submitProtect } from "./actions";
import { ANSWER_LABELS, AUDIENCES, DISCLAIMER, LEVEL_LABELS, QUESTIONS, scoreProtect, type Audience, type ProtectAnswer, type ProtectResult } from "./questionnaire";

const ICONS = { particulier: Home, commerce: Store, petite_entreprise: Building2 };
const OPTIONS: ProtectAnswer[] = ["oui", "partiel", "non", "ne_sait_pas"];

export function ProtectWizard() {
  const [audience, setAudience] = React.useState<Audience | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, ProtectAnswer>>({});
  const [step, setStep] = React.useState(0);
  const [result, setResult] = React.useState<ProtectResult | null>(null);
  const [department, setDepartment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [contactSent, setContactSent] = React.useState(false);
  const [assessmentId, setAssessmentId] = React.useState<string | null>(null);
  const heading = React.useRef<HTMLHeadingElement>(null);

  const themes = audience ? [...new Set(QUESTIONS[audience].map((q) => q.theme))] : [];
  const totalSteps = themes.length;
  React.useEffect(() => heading.current?.focus(), [step, audience, result]);

  async function finish() {
    if (!audience) return;
    setPending(true);
    setError(null);
    const r = await submitProtect({ audience, answers, department, contact: null });
    setPending(false);
    if (!r.ok) return setError(r.error);
    setResult(r.result);
    setAssessmentId(r.id);
  }

  async function downloadPdf() {
    const res = await fetch("/api/protect/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audience, answers }) });
    if (!res.ok) return setError("La synthèse PDF n'a pas pu être générée.");
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = "Diagnostic-NOAMIS-PROTECT.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function sendContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!audience) return;
    const fd = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const r = await attachProtectContact(assessmentId, {
      name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"), message: fd.get("message") || undefined,
      wants_appointment: fd.get("wants_appointment") === "on", availability: fd.get("availability") || undefined, consent: fd.get("consent") === "on",
    });
    setPending(false);
    if (!r.ok) return setError(r.error);
    setContactSent(true);
  }

  if (!audience) {
    return (
      <section aria-labelledby="w-title">
        <h2 id="w-title" ref={heading} tabIndex={-1} className="mb-4 font-display text-2xl font-semibold">Vous êtes…</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(AUDIENCES) as Audience[]).map((a) => {
            const Icon = ICONS[a];
            return (
              <button key={a} type="button" onClick={() => setAudience(a)} className="rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-gold focus-visible:border-gold">
                <Icon className="mb-3 size-6 text-gold" aria-hidden />
                <span className="block font-semibold">{AUDIENCES[a].label}</span>
                <span className="mt-1 block text-sm text-muted">{AUDIENCES[a].description}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (result) {
    return (
      <section aria-labelledby="r-title" className="space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 id="r-title" ref={heading} tabIndex={-1} className="font-display text-2xl font-semibold">Votre résultat indicatif</h2>
          <p className="mt-2 text-4xl font-semibold text-gradient-gold">{result.score} / 100</p>
          <p className="mt-1 text-lg">{LEVEL_LABELS[result.level]}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {result.byTheme.map((t) => (
              <div key={t.theme}>
                <p className="mb-1 text-sm text-muted">{t.theme}</p>
                <Progress value={t.score} label={`Indice ${t.theme}`} />
              </div>
            ))}
          </div>
        </div>
        <Notice tone="warning" title="Diagnostic préliminaire — pas un audit de sûreté">{DISCLAIMER}</Notice>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-3 text-lg font-semibold">Pistes d&apos;amélioration générales</h3>
          {result.recommendations.length ? (
            <ul className="space-y-2 text-sm">
              {result.recommendations.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className={cn("mt-1 size-2 shrink-0 rounded-full", r.priority === "haute" ? "bg-danger" : "bg-gold")} aria-hidden />
                  <span><strong>{r.theme}</strong> — {r.text}{r.priority === "haute" && <span className="sr-only"> (priorité)</span>}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Vos réponses ne font pas apparaître de piste prioritaire.</p>}
          <Button className="mt-5" variant="outline" onClick={downloadPdf}><Download /> Télécharger la synthèse (PDF)</Button>
        </div>
        <div className="rounded-2xl border border-gold/40 bg-surface p-6">
          <h3 className="text-lg font-semibold">Être recontacté par un consultant NOAMIS</h3>
          {contactSent ? (
            <p className="mt-3 flex items-center gap-2 text-success" role="status"><CheckCircle2 className="size-5" /> Merci : votre demande a bien été transmise. Un consultant vous recontactera.</p>
          ) : (
            <form onSubmit={sendContact} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="c-name" label="Nom et prénom" required><Input name="name" autoComplete="name" required maxLength={120} /></Field>
                <Field id="c-email" label="E-mail"><Input name="email" type="email" autoComplete="email" maxLength={254} /></Field>
                <Field id="c-phone" label="Téléphone"><Input name="phone" type="tel" autoComplete="tel" maxLength={25} /></Field>
                <Field id="c-availability" label="Disponibilités (facultatif)"><Input name="availability" maxLength={200} placeholder="ex. mardi matin" /></Field>
                <Field id="c-message" label="Votre besoin (facultatif)" className="sm:col-span-2" hint="N'indiquez pas votre adresse ni de détail sur vos dispositifs : un consultant vous recontactera.">
                  <Textarea name="message" rows={3} maxLength={2000} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm"><Checkbox name="wants_appointment" /> Je souhaite un rendez-vous</label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox name="consent" required className="mt-0.5" />
                <span>
                  J&apos;accepte que NOAMIS Sûreté Conseil utilise ces informations pour me recontacter au sujet de ma demande. Données conservées 3 ans maximum sans suite donnée,
                  jamais cédées. Droits d&apos;accès, de rectification et d&apos;effacement : voir la <Link href="/confidentialite" className="text-gold-text underline">politique de confidentialité</Link>.
                </span>
              </label>
              <Button type="submit" loading={pending}>Envoyer ma demande</Button>
            </form>
          )}
        </div>
        {error && <Notice tone="danger">{error}</Notice>}
      </section>
    );
  }

  const theme = themes[step]!;
  const questions = QUESTIONS[audience].filter((q) => q.theme === theme);
  const preview = scoreProtect(audience, answers);
  const isLast = step === totalSteps - 1;
  return (
    <section aria-labelledby="q-title" className="space-y-6">
      <div>
        <Progress value={((step + 1) / (totalSteps + 1)) * 100} label="Progression du questionnaire" />
        <p className="mt-1 text-xs text-muted">Étape {step + 1} sur {totalSteps} · {preview.answered} réponse(s)</p>
      </div>
      <h2 id="q-title" ref={heading} tabIndex={-1} className="font-display text-2xl font-semibold">{theme}</h2>
      <ol className="space-y-5">
        {questions.map((q) => (
          <li key={q.id} className="rounded-xl border border-border bg-surface p-5">
            <fieldset>
              <legend className="mb-3 text-sm font-medium">{q.label}</legend>
              <div className="flex flex-wrap gap-2">
                {OPTIONS.map((o) => (
                  <label key={o} className={cn("cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring", answers[q.id] === o ? "border-gold bg-gold/15 text-foreground" : "border-border text-muted hover:text-foreground")}>
                    <input type="radio" className="sr-only" name={q.id} value={o} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} />
                    {ANSWER_LABELS[o]}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      {isLast && (
        <Field id="dept" label="Votre département (facultatif)" hint="Utilisé uniquement à des fins statistiques. Aucune adresse n'est demandée.">
          <Input value={department} onChange={(e) => setDepartment(e.target.value.toUpperCase())} maxLength={3} className="w-28" inputMode="text" />
        </Field>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => (step === 0 ? setAudience(null) : setStep(step - 1))}><ArrowLeft /> Retour</Button>
        {isLast ? (
          <Button onClick={finish} loading={pending}>Voir mon résultat <ArrowRight /></Button>
        ) : (
          <Button onClick={() => setStep(step + 1)}>Suivant <ArrowRight /></Button>
        )}
      </div>
    </section>
  );
}
