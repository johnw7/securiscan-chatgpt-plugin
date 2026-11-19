import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" aria-label="Accueil NOAMIS 360°" className="shrink-0"><Logo subtitle={false} className="whitespace-nowrap" /></Link>
          <nav aria-label="Navigation publique" className="flex items-center gap-4 text-sm">
            <Link href="/diagnostic" className="hidden text-muted hover:text-foreground sm:inline">Diagnostic</Link>
            <Link href="/login" className="rounded-lg border border-gold/60 px-3 py-1.5 text-gold-text hover:bg-gold/10">Espace sécurisé</Link>
          </nav>
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-3 px-4 py-6 text-xs text-muted">
          <p>© {new Date().getFullYear()} NOAMIS Sûreté Conseil — conseil indépendant en sûreté</p>
          <nav aria-label="Liens légaux" className="flex gap-4">
            <Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
            <a href="https://www.noamis.fr/" className="hover:text-foreground" rel="noopener">noamis.fr</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
