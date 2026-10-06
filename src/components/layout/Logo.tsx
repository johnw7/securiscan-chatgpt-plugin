import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-9 shrink-0 place-items-center rounded-xl bg-brand-gradient shadow-glow", className)}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path d="M6 5h11M6 12h8M6 19h11M6 5v14" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="18.5" cy="12" r="1.8" fill="#021448" />
      </svg>
    </span>
  );
}

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-[17px] font-extrabold tracking-[0.06em]", dark ? "text-white" : "text-navy")}>E-DUST</span>
          <span className={cn("mt-1 text-[10px] font-semibold tracking-[0.32em]", dark ? "text-cyan-brand" : "text-electric")}>INTERVENTION</span>
        </span>
      )}
    </span>
  );
}
