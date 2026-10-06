import { FileArchive, FileCheck2, FileImage, FileSignature, FileSpreadsheet, FileText, Map } from "lucide-react";
import type { DocumentType } from "@/lib/types";
import { cn } from "@/lib/utils";

const META: Record<DocumentType, { icon: typeof FileText; className: string }> = {
  rapport: { icon: FileCheck2, className: "bg-electric-50 text-electric" },
  devis: { icon: FileSpreadsheet, className: "bg-violet-50 text-violet-600" },
  facture: { icon: FileText, className: "bg-emerald-50 text-emerald-600" },
  contrat: { icon: FileSignature, className: "bg-navy/5 text-navy" },
  attestation: { icon: FileCheck2, className: "bg-cyan-50 text-cyan-700" },
  photo: { icon: FileImage, className: "bg-amber-50 text-amber-700" },
  plan: { icon: Map, className: "bg-slate-100 text-slate-600" },
};

export function DocumentIcon({ type, name, className }: { type: DocumentType; name?: string; className?: string }) {
  const meta = META[type];
  const Icon = name?.endsWith(".zip") ? FileArchive : meta.icon;
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", meta.className, className)}>
      <Icon className="size-[18px]" />
    </span>
  );
}
