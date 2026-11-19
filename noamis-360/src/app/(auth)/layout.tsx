import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="contenu" className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--gold)_14%,transparent),transparent_60%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-card">{children}</div>
        <p className="mt-6 text-center text-xs text-muted">
          Accès réservé. Toute connexion est journalisée. —{" "}
          <a className="underline hover:text-foreground" href="/confidentialite">
            Confidentialité
          </a>
        </p>
      </div>
    </main>
  );
}
