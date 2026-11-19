"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function StaffError({ reset, error }: { reset: () => void; error: Error & { digest?: string } }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Cette page n'a pas pu être affichée"
      description={`Une erreur inattendue s'est produite.${error.digest ? ` Référence : ${error.digest}` : ""}`}
      action={<Button onClick={reset}>Réessayer</Button>}
    />
  );
}
