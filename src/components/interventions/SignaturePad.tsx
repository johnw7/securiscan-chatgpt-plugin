"use client";

/* eslint-disable @next/next/no-img-element -- signature en data URL */
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenLine, ShieldCheck } from "lucide-react";
import type { Intervention } from "@/lib/types";
import { useAppActions } from "@/lib/store/useAppActions";
import { getClient } from "@/lib/store/selectors";
import { useStore } from "@/lib/store/AppStore";
import { formatDateTime } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Zone de signature (souris, stylet ou doigt) basée sur les Pointer Events.
 */
export function SignaturePad({ intervention, disabled, large }: { intervention: Intervention; disabled?: boolean; large?: boolean }) {
  const { data } = useStore();
  const actions = useAppActions();
  const client = getClient(data, intervention.clientId);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [signer, setSigner] = useState(client?.contactName ?? "");

  const setup = useCallback(() => {
    const el = canvas.current;
    if (!el) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = el.getBoundingClientRect();
    el.width = rect.width * ratio;
    el.height = rect.height * ratio;
    const ctx = el.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#021448";
    ctx.lineWidth = 2.6;
    setHasInk(false);
  }, []);

  useEffect(() => {
    if (intervention.signature) return;
    setup();
    window.addEventListener("resize", setup);
    return () => window.removeEventListener("resize", setup);
  }, [setup, intervention.signature]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };

  const up = () => {
    drawing.current = false;
    last.current = null;
  };

  const validate = () => {
    if (!canvas.current || !hasInk) return;
    void actions.sign(intervention.id, canvas.current.toDataURL("image/png"), signer.trim() || client?.contactName || "Client");
  };

  if (intervention.signature) {
    return (
      <div className="animate-scale-in rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <ShieldCheck className="size-4" /> Rapport signé
        </div>
        <div className="mt-3 rounded-xl bg-white p-2 ring-1 ring-emerald-100">
          <img src={intervention.signature.dataUrl} alt={`Signature de ${intervention.signature.signedBy}`} className="mx-auto h-28 object-contain" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            <strong className="text-navy">{intervention.signature.signedBy}</strong> · {formatDateTime(intervention.signature.signedAt)}
          </span>
          {intervention.status !== "TERMINEE" && (
            <button onClick={() => actions.clearSignature(intervention.id)} className="font-semibold text-electric hover:underline">
              Recommencer
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-3 flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate-700">Nom du signataire</span>
        <input
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
          disabled={disabled}
          className="h-11 rounded-xl border border-line px-3.5 text-sm focus:border-electric/50 focus:ring-4 focus:ring-electric/10 focus:outline-none"
        />
      </label>
      <div className={cn("relative overflow-hidden rounded-2xl border-2 border-dashed bg-white", disabled ? "border-slate-200 opacity-60" : "border-electric/30")}>
        <canvas
          ref={canvas}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
          className={cn("block w-full touch-none", large ? "h-56" : "h-44", disabled ? "cursor-not-allowed" : "cursor-crosshair")}
          aria-label="Zone de signature du client"
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <PenLine className="size-6" />
            <span className="text-xs font-medium">{disabled ? "Disponible une fois l'intervention commencée" : "Signez ici avec la souris ou le doigt"}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-slate-200" />
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" icon={<Eraser className="size-4" />} onClick={setup} disabled={!hasInk} className="sm:w-auto">
          Effacer
        </Button>
        <Button onClick={validate} disabled={!hasInk || disabled} icon={<PenLine className="size-4" />} className="flex-1 uppercase tracking-wide" size={large ? "lg" : "md"}>
          Faire signer le client
        </Button>
      </div>
    </div>
  );
}
