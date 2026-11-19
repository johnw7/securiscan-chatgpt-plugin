import { cn } from "@/lib/utils";

/** Monogramme NOAMIS 360° : anneau ouvert (vision à 360°) et initiale N. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9", className)} aria-hidden>
      <circle cx="32" cy="32" r="22" fill="none" stroke="var(--gold)" strokeWidth="3.5" strokeDasharray="118 20" strokeLinecap="round" transform="rotate(-60 32 32)" />
      <path d="M24 41V23l16 18V23" fill="none" stroke="var(--gold-light)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-xl font-semibold tracking-wide text-foreground">
          NOAMIS <span className="text-gradient-gold">360°</span>
        </span>
        {subtitle && <span className="mt-0.5 block text-[10px] uppercase tracking-[0.22em] text-muted">Sûreté Conseil</span>}
      </span>
    </span>
  );
}
