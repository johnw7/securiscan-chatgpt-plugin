"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Eye, FileText, Printer } from "lucide-react";
import type { AppDocument } from "@/lib/types";
import { DOCUMENT_TYPE_META } from "@/lib/constants";
import { useStore } from "@/lib/store/AppStore";
import { getClient } from "@/lib/store/selectors";
import { formatDate } from "@/lib/dates";
import { formatFileSize } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ButtonLink } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentIcon } from "./DocumentIcon";

export function DocumentList({ documents, showClient = true }: { documents: AppDocument[]; showClient?: boolean }) {
  const { data } = useStore();
  const [preview, setPreview] = useState<AppDocument | null>(null);

  if (documents.length === 0) {
    return <EmptyState icon={<FileText className="size-6" />} title="Aucun document" text="Les rapports, devis et factures apparaîtront ici automatiquement." />;
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/70 sm:px-5">
            <DocumentIcon type={doc.type} name={doc.name} />
            <button onClick={() => setPreview(doc)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold text-navy hover:text-electric">{doc.name}</span>
              <span className="block truncate text-xs text-muted">
                {showClient && `${getClient(data, doc.clientId)?.name} · `}
                {formatDate(doc.date)} · {formatFileSize(doc.sizeKb)} · {doc.author}
              </span>
            </button>
            <span className="hidden sm:block">
              <Badge tone={DOCUMENT_TYPE_META[doc.type].tone} size="xs" dot={false}>
                {DOCUMENT_TYPE_META[doc.type].label}
              </Badge>
            </span>
            <IconButton onClick={() => setPreview(doc)} label="Aperçu">
              <Eye className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        subtitle={preview ? `${DOCUMENT_TYPE_META[preview.type].label} · ${getClient(data, preview.clientId)?.name}` : undefined}
        footer={
          preview?.type === "rapport" && preview.interventionId ? (
            <>
              <ButtonLink href={`/interventions/${preview.interventionId}`} variant="secondary">
                Voir l&apos;intervention
              </ButtonLink>
              <ButtonLink href={`/rapport/${preview.interventionId}`} icon={<Printer className="size-4" />} target="_blank">
                Ouvrir le rapport PDF
              </ButtonLink>
            </>
          ) : undefined
        }
      >
        {preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <DocumentIcon type={preview.type} name={preview.name} className="size-12" />
              <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">Date</dt>
                <dd className="font-medium text-navy">{formatDate(preview.date)}</dd>
                <dt className="text-muted">Taille</dt>
                <dd className="font-medium text-navy">{formatFileSize(preview.sizeKb)}</dd>
                <dt className="text-muted">Auteur</dt>
                <dd className="font-medium text-navy">{preview.author}</dd>
                {preview.interventionId && (
                  <>
                    <dt className="text-muted">Intervention</dt>
                    <dd>
                      <Link href={`/interventions/${preview.interventionId}`} className="font-medium text-electric hover:underline">
                        {preview.interventionId}
                      </Link>
                    </dd>
                  </>
                )}
              </dl>
            </div>
            {preview.type === "rapport" ? (
              <p className="text-sm text-slate-600">
                Le rapport est généré à partir des données de l&apos;intervention (checklist, photos, observations, signature) et peut être enregistré en PDF depuis le navigateur.
              </p>
            ) : (
              <div className="flex gap-3 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                <Download className="mt-0.5 size-4 shrink-0 text-electric" />
                <p>
                  Document de démonstration : le fichier n&apos;est pas stocké. Dans la version connectée, il est conservé dans un stockage
                  sécurisé (S3 / R2) et téléchargeable via une URL signée à durée limitée.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
