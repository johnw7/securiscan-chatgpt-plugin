"use client";

/* eslint-disable @next/next/no-img-element -- photos et signature en data URL */
import Link from "next/link";
import { ArrowLeft, CheckSquare, Printer, Square } from "lucide-react";
import { useStore, useStoreReady } from "@/lib/store/AppStore";
import { getClient, getMember, memberName } from "@/lib/store/selectors";
import { STATUS_META, TYPE_META } from "@/lib/constants";
import { formatDate, formatDateTime, formatDuration } from "@/lib/dates";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { PhotoTile } from "./PhotoGallery";

/**
 * Rapport d'intervention imprimable (« Enregistrer en PDF » du navigateur).
 * Version connectée : génération serveur (ex. @react-pdf/renderer ou Playwright)
 * et archivage automatique dans le stockage de documents.
 */
function Report({ id }: { id: string }) {
  const { data } = useStore();
  const i = data.interventions.find((x) => x.id === id);
  if (!i) return <p className="p-10 text-center text-muted">Intervention introuvable.</p>;
  const client = getClient(data, i.clientId);
  const tech = getMember(data, i.technicianId);
  const s = data.settings;

  return (
    <div className="mx-auto max-w-[820px] bg-white p-8 shadow-pop print:max-w-none print:p-0 print:shadow-none sm:p-12">
      <header className="flex items-start justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="font-display text-lg font-bold text-navy">{s.companyName}</p>
          <p className="text-xs text-muted">{s.address}</p>
          <p className="text-xs text-muted">{s.phone} · {s.email}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-electric uppercase">Rapport d&apos;intervention</p>
          <p className="font-display text-2xl font-bold text-navy">{i.id}</p>
          <p className="text-xs text-muted">Statut : {STATUS_META[i.status].label}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 py-6 text-sm">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">Client</p>
          <p className="font-semibold text-navy">{client?.name}</p>
          <p className="text-slate-600">{client?.contactName}</p>
          <p className="text-slate-600">{i.address}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">Intervention</p>
          <p className="font-semibold text-navy">{i.title}</p>
          <p className="text-slate-600">{TYPE_META[i.type].label} · {formatDate(i.date)} à {i.time ?? "—"}</p>
          <p className="text-slate-600">Technicien : {memberName(tech)} · durée prévue {formatDuration(i.durationMin)}</p>
        </div>
      </section>

      <section className="border-t border-line py-6">
        <h2 className="mb-2 text-sm font-bold text-navy">Description de la demande</h2>
        <p className="text-sm text-slate-700">{i.description}</p>
      </section>

      <section className="border-t border-line py-6">
        <h2 className="mb-3 text-sm font-bold text-navy">Checklist</h2>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {i.checklist.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-slate-700">
              {c.done ? <CheckSquare className="size-4 text-emerald-600" /> : <Square className="size-4 text-slate-300" />}
              {c.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line py-6">
        <h2 className="mb-2 text-sm font-bold text-navy">Observations du technicien</h2>
        <p className="text-sm whitespace-pre-line text-slate-700">{i.report || "—"}</p>
      </section>

      {i.photos.length > 0 && (
        <section className="border-t border-line py-6 print:break-inside-avoid">
          <h2 className="mb-3 text-sm font-bold text-navy">Photos ({i.photos.length})</h2>
          <div className="grid grid-cols-4 gap-2">
            {i.photos.map((p) => <PhotoTile key={p.id} photo={p} className="pointer-events-none" />)}
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-6 border-t border-line py-6 print:break-inside-avoid">
        <div className="text-sm">
          <h2 className="mb-2 font-bold text-navy">Chronologie</h2>
          <ul className="space-y-1 text-slate-600">
            {i.timeline.map((t) => <li key={t.id}><span className="tabular font-semibold text-navy">{t.time}</span> — {t.label}</li>)}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-navy">Signature du client</h2>
          {i.signature ? (
            <div className="rounded-xl border border-line p-3">
              <img src={i.signature.dataUrl} alt="Signature du client" className="h-24 w-full object-contain" />
              <p className="mt-2 text-xs text-slate-600">{i.signature.signedBy} · {formatDateTime(i.signature.signedAt)}</p>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-muted">Non signé</p>
          )}
        </div>
      </section>

      <footer className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[10px] text-slate-400">
        <span>Document généré avec {BRAND.productName}</span>
        <span>{BRAND.demoNotice} · données fictives</span>
      </footer>
    </div>
  );
}

export function ReportDocument({ id }: { id: string }) {
  const ready = useStoreReady();
  return (
    <div className="min-h-dvh bg-canvas px-4 py-6 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-[820px] items-center justify-between gap-3">
        <Link href={`/interventions/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric">
          <ArrowLeft className="size-4" /> Retour
        </Link>
        <Logo compact />
        <Button icon={<Printer className="size-4" />} onClick={() => window.print()}>Enregistrer en PDF</Button>
      </div>
      {ready ? <Report id={id} /> : <div className="mx-auto h-[600px] max-w-[820px] animate-pulse rounded-2xl bg-white" />}
    </div>
  );
}
