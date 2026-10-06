import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const base = "grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-electric-50 hover:text-electric";

export function IconLink({ href, label, children, className, external }: { href: string; label: string; children: ReactNode; className?: string; external?: boolean }) {
  if (external) {
    return (
      <a href={href} aria-label={label} title={label} className={cn(base, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={label} title={label} className={cn(base, className)}>
      {children}
    </Link>
  );
}

export function IconButton({ onClick, label, children, className }: { onClick: () => void; label: string; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cn(base, className)}>
      {children}
    </button>
  );
}
