import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="contenu" className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <Compass className="mx-auto size-10 text-gold" aria-hidden />
        <h1 className="mt-4 font-display text-3xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-muted">Cet élément n&apos;existe pas ou vous n&apos;avez pas les droits pour le consulter.</p>
        <Button asChild className="mt-6"><Link href="/home">Retour à mon espace</Link></Button>
      </div>
    </main>
  );
}
