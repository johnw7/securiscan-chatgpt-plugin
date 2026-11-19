"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice, Skeleton } from "@/components/ui/misc";
import { createBrowserSupabase } from "@/lib/supabase/client";

function CodeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      className="text-center text-lg tracking-[0.5em]"
      required
      {...props}
    />
  );
}

/** Vérification TOTP (élévation de session en aal2). */
export function MfaChallengeForm() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((f) => f.status === "verified");
    if (!factor) {
      router.replace("/mfa/enroll");
      return;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    setPending(false);
    if (error) {
      setError("Code incorrect ou expiré. Vérifiez l'heure de votre téléphone.");
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="code" label="Code à 6 chiffres" hint="Ouvrez votre application d'authentification (Google Authenticator, Microsoft Authenticator, 1Password…).">
        <CodeInput value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
      </Field>
      {error && <Notice tone="danger">{error}</Notice>}
      <Button type="submit" className="w-full" loading={pending} disabled={code.length !== 6}>
        Vérifier
      </Button>
    </form>
  );
}

/** Enrôlement d'un facteur TOTP. */
export function MfaEnrollForm() {
  const router = useRouter();
  const [factor, setFactor] = React.useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createBrowserSupabase();
      const { data: list } = await supabase.auth.mfa.listFactors();
      if (list?.totp.some((f) => f.status === "verified")) {
        router.replace("/mfa");
        return;
      }
      // Nettoie les enrôlements inachevés.
      for (const f of list?.all ?? []) {
        if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `NOAMIS 360° ${new Date().toISOString().slice(0, 10)}` });
      if (cancelled) return;
      if (error || !data) {
        setError("Impossible de démarrer l'enrôlement. Reconnectez-vous puis réessayez.");
        return;
      }
      setFactor({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!factor) return;
    setPending(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    setPending(false);
    if (error) {
      setError("Code incorrect. Réessayez avec le code affiché actuellement.");
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {factor ? (
        <>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Scannez ce QR code avec votre application d&apos;authentification.</li>
            <li>Saisissez le code à 6 chiffres affiché.</li>
          </ol>
          <div className="mx-auto w-fit rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={factor.qr} alt="QR code d'enrôlement de la double authentification" width={180} height={180} />
          </div>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer">Saisie manuelle de la clé</summary>
            <code className="mt-2 block break-all rounded bg-surface-2 p-2 text-foreground">{factor.secret}</code>
          </details>
        </>
      ) : (
        !error && <Skeleton className="mx-auto h-52 w-52" />
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field id="code" label="Code de vérification">
          <CodeInput value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} disabled={!factor} />
        </Field>
        {error && <Notice tone="danger">{error}</Notice>}
        <Button type="submit" className="w-full" loading={pending} disabled={!factor || code.length !== 6}>
          Activer la double authentification
        </Button>
      </form>
    </div>
  );
}
