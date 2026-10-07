"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Captions,
  CaptionsOff,
  Download,
  Maximize,
  MonitorPlay,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_IMAGES } from "./assets";
import { PreventionScene } from "./PreventionScene";
import { DURATION, FORMAT_LABEL, SHOTS, STAGE_H, STAGE_W, cueAt, shotAt, toSrt, type Format } from "./timeline";

declare global {
  interface Window {
    /** Pilotage de l'export image par image (scripts/render-prevention-video.mjs). */
    __prevention?: { setTime: (t: number) => Promise<void>; duration: number; ready: Promise<void>; srt: string };
  }
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function preload(): Promise<void> {
  return Promise.all(
    ALL_IMAGES.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => undefined);
}

/** Met la scène (résolution native) à l'échelle de son conteneur, sans jamais la déformer. */
function useFitScale(format: Format) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H[format]));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [format]);
  return { ref, scale };
}

export function PreventionPlayer() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [format, setFormat] = useState<Format>("9x16");
  const [subtitles, setSubtitles] = useState(true);
  /** Mode démonstration : plein écran, lecture automatique en boucle, interface masquée. */
  const [demo, setDemo] = useState(false);
  /** Mode export : scène seule à sa taille réelle, pilotée par le script de rendu. */
  const [capture, setCapture] = useState(false);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(0);
  tRef.current = t;

  // Paramètres d'URL : ?format=4x5 · ?t=12.5 · ?mode=demo · ?capture=1 · ?cc=0
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("format") === "4x5") setFormat("4x5");
    const start = Number(q.get("t"));
    if (Number.isFinite(start) && start > 0) setT(Math.min(start, DURATION));
    if (q.get("cc") === "0") setSubtitles(false);
    if (q.get("capture") === "1") setCapture(true);
    if (q.get("mode") === "demo") {
      setDemo(true);
      setPlaying(true);
    }
    const loaded = preload().then(() => setReady(true));
    window.__prevention = {
      duration: DURATION,
      ready: loaded,
      srt: toSrt(),
      setTime: (time: number) =>
        new Promise<void>((resolve) => {
          setT(time);
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    };
  }, []);

  // Horloge de lecture
  useEffect(() => {
    if (!playing || !ready) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let next = tRef.current + dt;
      if (next >= DURATION) {
        if (demo) next = 0;
        else {
          setT(DURATION);
          setPlaying(false);
          return;
        }
      }
      setT(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, ready, demo]);

  const togglePlay = useCallback(() => {
    if (tRef.current >= DURATION) setT(0);
    setPlaying((p) => !p);
  }, []);

  const seek = useCallback((time: number) => setT(Math.max(0, Math.min(DURATION, time))), []);

  const enterDemo = useCallback(() => {
    setDemo(true);
    setT(0);
    setPlaying(true);
    rootRef.current?.requestFullscreen?.().catch(() => undefined);
  }, []);

  const exitDemo = useCallback(() => {
    setDemo(false);
    setPlaying(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") seek(tRef.current + 5);
      else if (e.key === "ArrowLeft") seek(tRef.current - 5);
      else if (e.key === "c" || e.key === "s") setSubtitles((v) => !v);
      else if (e.key === "1") setFormat("9x16");
      else if (e.key === "2") setFormat("4x5");
      else if (e.key === "d") (demo ? exitDemo : enterDemo)();
      else if (e.key === "Escape" && demo) exitDemo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demo, enterDemo, exitDemo, seek, togglePlay]);

  const { ref: fitRef, scale } = useFitScale(format);

  const downloadSrt = () => {
    const blob = new Blob([toSrt()], { type: "application/x-subrip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "prevention-chemin-ecole.srt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (capture) {
    return (
      <div className="fixed top-0 left-0" style={{ width: STAGE_W, height: STAGE_H[format] }}>
        <PreventionScene t={t} format={format} subtitles={subtitles} />
      </div>
    );
  }

  const shotIndex = shotAt(t);
  const cue = cueAt(t);

  return (
    <div ref={rootRef} className={cn("flex min-h-dvh flex-col bg-[#070b1f] text-white", demo && "h-dvh")}>
      {!demo && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-cyan-brand uppercase">Police Municipale · Prévention</p>
            <h1 className="font-display text-lg font-extrabold">Sur le chemin de l&apos;école — vidéo animée</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-white/10 p-1" role="group" aria-label="Format">
              {(["9x16", "4x5"] as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                    format === f ? "bg-white text-navy" : "text-white/70 hover:text-white",
                  )}
                >
                  {FORMAT_LABEL[f]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSubtitles((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
              aria-pressed={subtitles}
            >
              {subtitles ? <Captions size={16} /> : <CaptionsOff size={16} />} Sous-titres
            </button>
            <button
              type="button"
              onClick={downloadSrt}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <Download size={16} /> .srt
            </button>
            <button
              type="button"
              onClick={enterDemo}
              className="flex items-center gap-2 rounded-lg bg-electric px-3 py-2 text-sm font-bold shadow-glow hover:bg-electric-600"
            >
              <MonitorPlay size={16} /> MODE DÉMO
            </button>
          </div>
        </header>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row">
        <div ref={fitRef} className={cn("relative min-h-[60vh] flex-1", demo && "min-h-0")}>
          <div
            className="absolute top-1/2 left-1/2 overflow-hidden rounded-xl shadow-2xl"
            style={{ width: STAGE_W * scale, height: STAGE_H[format] * scale, transform: "translate(-50%, -50%)" }}
            onClick={demo ? undefined : togglePlay}
          >
            <div style={{ width: STAGE_W, height: STAGE_H[format], transform: `scale(${scale})`, transformOrigin: "0 0" }}>
              <PreventionScene t={t} format={format} subtitles={subtitles} />
            </div>
            {!ready && (
              <div className="absolute inset-0 grid place-items-center bg-[#0b1230]">
                <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-brand" />
              </div>
            )}
            {ready && !playing && !demo && (
              <div className="absolute inset-0 grid place-items-center bg-black/20">
                <span className="grid size-16 place-items-center rounded-full bg-white/90 text-navy shadow-xl">
                  <Play size={30} fill="currentColor" />
                </span>
              </div>
            )}
          </div>
          {demo && (
            <button
              type="button"
              onClick={exitDemo}
              className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 opacity-30 transition hover:opacity-100"
            >
              <X size={14} /> Quitter (Échap)
            </button>
          )}
        </div>

        {!demo && (
          <aside className="flex w-full flex-col gap-3 lg:w-80">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">Plan en cours</p>
              <p className="mt-1 font-display text-lg font-bold">{SHOTS[shotIndex].plan}</p>
              <p className="mt-2 min-h-12 text-sm text-white/70">
                {cue ? (
                  <>
                    <b className={cue.speaker === "enfant" ? "text-amber-400" : "text-cyan-brand"}>
                      {cue.speaker === "enfant" ? "Léo" : "Policier"} :
                    </b>{" "}
                    {cue.text}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <ol className="flex flex-col gap-1 rounded-xl bg-white/5 p-2 text-sm">
              {SHOTS.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => seek(s.start)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition",
                      i === shotIndex ? "bg-electric text-white" : "text-white/70 hover:bg-white/10",
                    )}
                  >
                    <span>
                      {i + 1}. {s.label} <span className="text-white/50">· {s.plan}</span>
                    </span>
                    <span className="tabular-nums text-white/60">{fmtTime(s.start)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="text-xs text-white/40">
              Espace : lecture · ← → : ±5 s · C : sous-titres · 1 / 2 : format · D : mode démo
            </p>
          </aside>
        )}
      </div>

      {!demo && (
        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={togglePlay}
            className="grid size-10 place-items-center rounded-full bg-white text-navy"
            aria-label={playing ? "Pause" : "Lecture"}
          >
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={() => seek(0)}
            className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/15"
            aria-label="Revenir au début"
          >
            <RotateCcw size={18} />
          </button>
          <span className="w-24 text-sm tabular-nums text-white/70">
            {fmtTime(t)} / {fmtTime(DURATION)}
          </span>
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2">
              {SHOTS.map((s) => (
                <span
                  key={s.id}
                  className="h-1.5 border-r-2 border-[#070b1f]"
                  style={{ width: `${((s.end - s.start) / DURATION) * 100}%` }}
                />
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={DURATION}
              step={0.01}
              value={t}
              onChange={(e) => seek(Number(e.target.value))}
              className="relative w-full accent-electric"
              aria-label="Position dans la vidéo"
            />
          </div>
          <button
            type="button"
            onClick={() => rootRef.current?.requestFullscreen?.()}
            className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/15"
            aria-label="Plein écran"
          >
            <Maximize size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
