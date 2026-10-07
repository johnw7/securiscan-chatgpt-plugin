"use client";

import type { CSSProperties, ReactNode } from "react";
import { Ban, Car, Check, Eye, Gift, PhoneCall, School, ShieldCheck, Store, UserX } from "lucide-react";
import { CHILD, DECOR, OFFICER, type CharacterAsset } from "./assets";
import {
  SHOTS,
  SPEAKERS,
  STAGE_H,
  STAGE_W,
  appear,
  clamp01,
  cueAt,
  easeInOut,
  easeOut,
  easeOutBack,
  lerp,
  shotAt,
  type Format,
  type Shot,
  type ShotId,
} from "./timeline";

/* ------------------------------------------------------------------ */
/* Mise en place des plans                                             */
/* ------------------------------------------------------------------ */

/** Position d'un personnage : centre du corps (x), ligne des pieds (y) et hauteur à l'écran, en px de scène. */
type Pose = { x: number; y: number; h: number };
type Cam = { z: number; px: number; py: number };
type Bg = { src: string; fx: number; fy: number; z: number };

type Layout = {
  bg: Bg;
  /** Caméra de début et de fin de plan (travelling / zoom simulés). */
  cam: [Cam, Cam];
  child?: [Pose, Pose];
  officer?: [Pose, Pose];
  /** Personnage net (l'autre est légèrement flouté : mise au point sur celui qui parle). */
  focus?: "enfant" | "policier";
};

const still = (p: Pose): [Pose, Pose] => [p, p];
const cam = (z0: number, z1: number, px0 = 0, px1 = 0, py0 = 0, py1 = 0): [Cam, Cam] => [
  { z: z0, px: px0, py: py0 },
  { z: z1, px: px1, py: py1 },
];

/** Hauteur relative de l'enfant par rapport au policier (cohérence d'échelle entre les plans). */
const CHILD_RATIO = 0.68;

function layoutFor(id: ShotId, f: Format): Layout {
  const v = f === "9x16";
  switch (id) {
    case "intro":
      return { bg: { src: DECOR.original, fx: 50, fy: v ? 50 : 22, z: 1 }, cam: cam(1, 1) };

    case "enfant-1":
      // Plan américain (coupé aux genoux, volontaire) ; travelling avant lent.
      return {
        bg: { src: DECOR.placeFlou, fx: 30, fy: 40, z: 1.1 },
        cam: cam(1, 1.06, -20, 10, 0, 30),
        child: v ? still({ x: 470, y: 2520, h: 2300 }) : still({ x: 500, y: 1920, h: 1800 }),
        focus: "enfant",
      };

    case "policier-1":
      return {
        bg: { src: DECOR.placeFlou, fx: 65, fy: 38, z: 1.12 },
        cam: cam(1.05, 1, 0, 0, 30, 0),
        officer: v ? still({ x: 560, y: 2560, h: 2380 }) : still({ x: 560, y: 1940, h: 1840 }),
        focus: "policier",
      };

    case "duo": {
      // Plan à deux en pied ; travelling latéral, l'enfant parle (mise au point sur lui).
      const oh = v ? 1380 : 1110;
      const gy = v ? 1745 : 1300;
      return {
        bg: { src: DECOR.place, fx: 48, fy: v ? 60 : 64, z: 1.04 },
        cam: cam(1.04, 1, 40, -30),
        // Le policier se tient devant la zone retouchée du décor (sa position dans la photo d'origine).
        child: still({ x: v ? 235 : 250, y: gy + 25, h: oh * CHILD_RATIO }),
        officer: still({ x: v ? 590 : 600, y: gy, h: oh }),
        focus: "enfant",
      };
    }

    case "conseil-1":
      return {
        bg: { src: DECOR.placeFlou, fx: 70, fy: 45, z: 1.15 },
        cam: cam(1, 1.04, 0, -10),
        officer: v ? still({ x: 720, y: 2400, h: 2200 }) : still({ x: 840, y: 1700, h: 1500 }),
        focus: "policier",
      };

    case "conseil-2":
      return {
        bg: { src: DECOR.placeFlou, fx: 25, fy: 45, z: 1.15 },
        cam: cam(1.04, 1, 10, 0),
        officer: v ? still({ x: 360, y: 2400, h: 2200 }) : still({ x: 240, y: 1700, h: 1500 }),
        focus: "policier",
      };

    case "conseil-3":
      // 9:16 : la carte occupe le centre, le policier reste seul (visage dégagé).
      // 4:5 : plan à deux rapproché, l'enfant écoute au premier plan (flou), le policier parle.
      return v
        ? {
            bg: { src: DECOR.placeFlou, fx: 55, fy: 45, z: 1.12 },
            cam: cam(1, 1.04, 0, -15),
            officer: still({ x: 560, y: 2400, h: 2200 }),
            focus: "policier",
          }
        : {
            bg: { src: DECOR.placeFlou, fx: 55, fy: 45, z: 1.12 },
            cam: cam(1, 1.03, 0, -15),
            officer: still({ x: 850, y: 1640, h: 1420 }),
            child: still({ x: 165, y: 1800, h: 1420 * CHILD_RATIO * 1.05 }),
            focus: "policier",
          };

    case "enfant-2":
      return {
        bg: { src: DECOR.placeFlou, fx: 35, fy: 40, z: 1.1 },
        cam: cam(1.06, 1, 0, 0, 20, 0),
        child: v ? still({ x: 420, y: 2440, h: 2240 }) : still({ x: 400, y: 1900, h: 1780 }),
        focus: "enfant",
      };

    case "policier-2":
      return {
        bg: { src: DECOR.placeFlou, fx: 60, fy: 38, z: 1.12 },
        cam: cam(1, 1.07, 0, 0, 0, 40),
        officer: v ? still({ x: 520, y: 2480, h: 2300 }) : still({ x: 540, y: 1900, h: 1800 }),
        focus: "policier",
      };

    case "final": {
      const oh = v ? 1060 : 860;
      const gy = v ? 1520 : 1230;
      return {
        bg: { src: DECOR.place, fx: 48, fy: v ? 62 : 66, z: 1.02 },
        cam: cam(1.06, 1, 0, 0, 20, 0),
        child: still({ x: v ? 290 : 330, y: gy + 20, h: oh * CHILD_RATIO }),
        officer: still({ x: 600, y: gy, h: oh }),
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Personnages                                                         */
/* ------------------------------------------------------------------ */

function Character({
  asset,
  pose,
  t,
  talking,
  soft,
  tint,
}: {
  asset: CharacterAsset;
  pose: Pose;
  t: number;
  talking: boolean;
  /** Hors mise au point (profondeur de champ). */
  soft: boolean;
  tint?: string;
}) {
  const h = pose.h;
  const w = (h * asset.width) / asset.height;
  const left = pose.x - w * asset.anchorX;
  const top = pose.y - h;
  // Respiration permanente + léger rebond quand le personnage parle (sans déformer ses proportions).
  const breathe = 1 + Math.sin(t * 2.1) * 0.004;
  const bob = talking ? Math.abs(Math.sin(t * 6.5)) * h * 0.004 : 0;
  const tilt = talking ? Math.sin(t * 3.2) * 0.35 : 0;

  return (
    <div className="absolute" style={{ left, top, width: w, height: h }}>
      {/* Ombre portée au sol */}
      <div
        className="absolute rounded-[50%]"
        style={{
          left: w * asset.anchorX - w * 0.48 + w * 0.06,
          top: h - w * 0.07,
          width: w * 0.96,
          height: w * 0.15,
          background: "radial-gradient(closest-side, rgba(38,24,18,0.55), rgba(38,24,18,0.22) 60%, transparent)",
          filter: soft ? "blur(6px)" : "blur(2px)",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.src}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
        style={{
          objectFit: "contain",
          transformOrigin: `${asset.anchorX * 100}% 100%`,
          transform: `translateY(${-bob}px) rotate(${tilt}deg) scale(${breathe})`,
          filter: [
            tint ?? "",
            soft ? "blur(3px) brightness(0.86)" : "",
            "drop-shadow(0 18px 24px rgba(20,14,30,0.25))",
          ].join(" "),
          transition: "none",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Habillage graphique                                                 */
/* ------------------------------------------------------------------ */

const NAVY = "#021448";
const BLUE = "#0b58ff";
const RED = "#e5243b";

function rise(k: number, distance = 40): CSSProperties {
  const e = easeOut(k);
  return { opacity: clamp01(k * 1.4), transform: `translateY(${(1 - e) * distance}px)` };
}

function pop(k: number): CSSProperties {
  const e = k <= 0 ? 0 : easeOutBack(clamp01(k));
  return { opacity: clamp01(k * 2), transform: `scale(${0.4 + 0.6 * e})` };
}

function Tricolore({ width = 120, height = 8 }: { width?: number; height?: number }) {
  return (
    <span className="inline-flex overflow-hidden rounded-full" style={{ width, height }}>
      <span className="flex-1" style={{ background: "#1d3fbb" }} />
      <span className="flex-1 bg-white" />
      <span className="flex-1" style={{ background: RED }} />
    </span>
  );
}

function BrandChip({ k }: { k: number }) {
  return (
    <div
      className="absolute left-[56px] flex items-center gap-4 rounded-full bg-white/92 py-3 pr-7 pl-4 shadow-lg backdrop-blur"
      style={{ top: "var(--safe-top)", ...rise(k, -20) }}
    >
      <span className="grid size-12 place-items-center rounded-full text-white" style={{ background: NAVY }}>
        <ShieldCheck size={28} strokeWidth={2.4} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[26px] font-extrabold tracking-wide" style={{ color: NAVY }}>
          POLICE MUNICIPALE
        </span>
        <span className="mt-1.5 flex items-center gap-2 text-[19px] font-semibold text-slate-500">
          <Tricolore width={42} height={6} /> Prévention
        </span>
      </span>
    </div>
  );
}

function StepDots({ active, k }: { active: number; k: number }) {
  return (
    <div className="absolute right-[56px] flex gap-3" style={{ top: "calc(var(--safe-top) + 14px)", ...rise(k, -20) }}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className="grid size-[54px] place-items-center rounded-full font-display text-[26px] font-extrabold shadow-lg"
          style={
            n === active
              ? { background: BLUE, color: "white" }
              : n < active
                ? { background: "white", color: BLUE }
                : { background: "rgba(255,255,255,0.55)", color: "rgba(2,20,72,0.45)" }
          }
        >
          {n < active ? <Check size={28} strokeWidth={3} /> : n}
        </span>
      ))}
    </div>
  );
}

function Subtitle({ t, show }: { t: number; show: boolean }) {
  const cue = cueAt(t);
  if (!show || !cue) return null;
  const k = Math.min(appear(t, cue.start, 0.22), clamp01((cue.end - t) / 0.18));
  const sp = SPEAKERS[cue.speaker];
  return (
    <div
      className="absolute inset-x-[48px] flex flex-col items-center"
      style={{ bottom: "var(--safe-bottom)", opacity: k, transform: `translateY(${(1 - k) * 12}px)` }}
    >
      <span
        className="mb-[-14px] z-10 rounded-full px-6 py-2 font-display text-[24px] font-extrabold tracking-wider text-white uppercase shadow-md"
        style={{ background: sp.color }}
      >
        {sp.name}
      </span>
      <p
        className="rounded-[28px] px-9 pt-7 pb-6 text-center font-display font-bold leading-[1.22] text-white shadow-2xl"
        style={{ background: "rgba(2,20,72,0.86)", fontSize: "var(--sub-size)", textWrap: "balance" }}
      >
        {cue.text}
      </p>
    </div>
  );
}

/* ---------- Cartes conseil ---------- */

function TipCard({
  n,
  title,
  text,
  k,
  children,
  side,
}: {
  n: number;
  title: string;
  text: string;
  k: number;
  children: ReactNode;
  side: "left" | "right";
}) {
  return (
    <div
      className="absolute rounded-[44px] bg-white/95 p-10 shadow-2xl"
      style={{
        top: "var(--card-top)",
        width: "var(--card-w)",
        ...(side === "left" ? { left: 48 } : { right: 48 }),
        ...rise(k, 60),
      }}
    >
      <div className="flex items-center gap-5">
        <span
          className="grid size-[76px] shrink-0 place-items-center rounded-full font-display text-[42px] font-extrabold text-white"
          style={{ background: BLUE, boxShadow: "0 10px 24px -8px rgba(11,88,255,0.7)" }}
        >
          {n}
        </span>
        <h2 className="font-display text-[length:var(--title-size)] font-extrabold leading-[1.08]" style={{ color: NAVY }}>
          {title}
        </h2>
      </div>
      <p className="mt-5 text-[length:var(--text-size)] font-medium leading-snug text-slate-600">{text}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Chip({ k, icon, label, tone = "blue" }: { k: number; icon: ReactNode; label: string; tone?: "blue" | "red" | "green" }) {
  const colors = {
    blue: { bg: "#eef4ff", fg: BLUE },
    red: { bg: "#fde8eb", fg: RED },
    green: { bg: "#e7f8ee", fg: "#12a150" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-3 rounded-full px-5 py-3 font-display text-[length:var(--chip-size)] font-bold"
      style={{ background: colors.bg, color: colors.fg, ...pop(k) }}
    >
      {icon}
      {label}
    </span>
  );
}

/** Pictogramme animé : passage piéton dont les bandes apparaissent une à une. */
function Crosswalk({ t, start }: { t: number; start: number }) {
  return (
    <svg viewBox="0 0 220 120" className="h-[var(--picto-h)] w-auto">
      <rect x="0" y="0" width="220" height="120" rx="22" fill="#334155" />
      {[0, 1, 2, 3, 4].map((i) => {
        const k = easeOut(appear(t, start + i * 0.12, 0.35));
        return <rect key={i} x={20 + i * 38} y={18} width={22} height={84 * k} rx={4} fill="white" />;
      })}
    </svg>
  );
}

function Conseil1({ t }: { t: number }) {
  const s = 20;
  const look = (i: number) => appear(t, 24.0 + i * 1.05, 0.4);
  return (
    <TipCard
      n={1}
      side="left"
      k={appear(t, s + 0.3, 0.6)}
      title="Je traverse au passage piéton"
      text="Je regarde à gauche, à droite, puis encore à gauche avant de traverser."
    >
      <div className="flex flex-wrap items-center gap-5">
        <div style={pop(appear(t, s + 0.8, 0.5))}>
          <Crosswalk t={t} start={s + 1} />
        </div>
        <div className="flex flex-wrap gap-3">
          {["Gauche", "Droite", "Gauche"].map((label, i) => (
            <Chip
              key={i}
              k={look(i)}
              tone={i === 2 && look(2) >= 1 ? "green" : "blue"}
              icon={<Eye size={30} strokeWidth={2.6} style={{ transform: `scaleX(${i === 1 ? 1 : -1})` }} />}
              label={label}
            />
          ))}
        </div>
      </div>
    </TipCard>
  );
}

function Conseil2({ t }: { t: number }) {
  const s = 27.5;
  const ring = 1 + Math.sin(t * 4) * 0.04;
  return (
    <TipCard
      n={2}
      side="right"
      k={appear(t, s + 0.3, 0.6)}
      title="Je ne suis jamais un inconnu"
      text="Même s'il me propose un cadeau, des bonbons ou de me raccompagner en voiture."
    >
      <div className="flex flex-wrap items-center gap-6">
        <span
          className="grid size-[var(--picto-h)] place-items-center rounded-full"
          style={{ background: "#fde8eb", color: RED, ...pop(appear(t, s + 0.9, 0.5)), scale: String(ring) }}
        >
          <UserX size={72} strokeWidth={2.2} />
        </span>
        <div className="flex flex-wrap gap-3">
          <Chip k={appear(t, 31.6, 0.4)} tone="red" icon={<Gift size={30} strokeWidth={2.4} />} label="Cadeau" />
          <Chip k={appear(t, 32.4, 0.4)} tone="red" icon={<Car size={30} strokeWidth={2.4} />} label="Voiture" />
          <Chip k={appear(t, 33.2, 0.4)} tone="red" icon={<Ban size={30} strokeWidth={2.6} />} label="Je refuse" />
        </div>
      </div>
    </TipCard>
  );
}

function Conseil3({ t }: { t: number }) {
  const s = 35;
  const k17 = appear(t, 38.9, 0.5);
  const pulse = (t * 1.2) % 1;
  return (
    <TipCard
      n={3}
      side="left"
      k={appear(t, s + 0.3, 0.6)}
      title="En cas de problème : le 17"
      text="Je vais voir un adulte de confiance ou j'appelle le 17 (police secours)."
    >
      <div className="flex flex-wrap items-center gap-6">
        <span className="relative grid size-[var(--picto-h)] place-items-center" style={pop(k17)}>
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: RED, opacity: 0.35 * (1 - pulse), transform: `scale(${1 + pulse * 0.45})` }}
          />
          <span className="relative grid size-full place-items-center rounded-full text-white" style={{ background: RED }}>
            <span className="flex flex-col items-center leading-none">
              <PhoneCall size={34} strokeWidth={2.4} />
              <span className="mt-1 font-display text-[46px] font-extrabold">17</span>
            </span>
          </span>
        </span>
        <div className="flex flex-wrap gap-3">
          <Chip k={appear(t, 36.6, 0.4)} icon={<Store size={30} strokeWidth={2.4} />} label="Commerçant" />
          <Chip k={appear(t, 37.2, 0.4)} icon={<School size={30} strokeWidth={2.4} />} label="Enseignant" />
          <Chip k={appear(t, 37.8, 0.4)} icon={<ShieldCheck size={30} strokeWidth={2.4} />} label="Policier" />
        </div>
      </div>
    </TipCard>
  );
}

const REFLEXES = [
  { label: "Passage piéton", icon: Eye, color: BLUE },
  { label: "Jamais d'inconnu", icon: UserX, color: RED },
  { label: "Urgence : 17", icon: PhoneCall, color: "#12a150" },
];

/** Léo récapitule : les trois réflexes se cochent au rythme de sa phrase. */
function Recap({ t }: { t: number }) {
  const times = [43.0, 43.9, 44.6];
  return (
    <div className="absolute right-[48px] flex flex-col items-end gap-4" style={{ top: "var(--recap-top)" }}>
      {REFLEXES.map((r, i) => {
        const k = appear(t, times[i], 0.45);
        const Icon = r.icon;
        return (
          <span
            key={r.label}
            className="flex items-center gap-4 rounded-full bg-white/95 py-3 pr-7 pl-3 font-display text-[length:var(--chip-size)] font-bold shadow-xl"
            style={{ color: NAVY, ...pop(k) }}
          >
            <span className="grid size-[52px] place-items-center rounded-full text-white" style={{ background: r.color }}>
              <Icon size={28} strokeWidth={2.6} />
            </span>
            {r.label}
            <Check size={32} strokeWidth={3.2} color="#12a150" style={{ opacity: appear(t, times[i] + 0.3, 0.3) }} />
          </span>
        );
      })}
    </div>
  );
}

function IntroTitle({ t }: { t: number }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(2,20,72,0.15) 0%, rgba(2,20,72,0) 35%, rgba(2,20,72,0.25) 55%, rgba(2,20,72,0.88) 100%)" }}
      />
      <div className="absolute inset-x-[64px] flex flex-col items-start" style={{ bottom: "var(--intro-bottom)" }}>
        <span
          className="flex items-center gap-3 rounded-full bg-white px-6 py-3 font-display text-[26px] font-extrabold tracking-wider"
          style={{ color: NAVY, ...rise(appear(t, 0.4, 0.6)) }}
        >
          <ShieldCheck size={30} strokeWidth={2.4} color={BLUE} /> POLICE MUNICIPALE · PRÉVENTION
        </span>
        <h1
          className="mt-7 font-display font-extrabold leading-[1.02] text-white"
          style={{ fontSize: "var(--intro-size)", textShadow: "0 6px 30px rgba(0,0,0,0.35)", ...rise(appear(t, 0.9, 0.7), 60) }}
        >
          Sur le chemin
          <br />
          de l&apos;école
        </h1>
        <div className="mt-6" style={rise(appear(t, 1.5, 0.6))}>
          <Tricolore width={180} height={10} />
        </div>
        <p className="mt-6 text-[36px] font-semibold text-white/90" style={rise(appear(t, 1.9, 0.6))}>
          3 conseils pour y aller en toute sécurité
        </p>
      </div>
    </>
  );
}

function FinalCard({ t, f }: { t: number; f: Format }) {
  const s = 51.5;
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(2,20,72,0.82) 0%, rgba(2,20,72,0.35) 32%, rgba(2,20,72,0) 55%, rgba(2,20,72,0.75) 100%)" }}
      />
      <div className="absolute inset-x-[56px] flex flex-col items-center text-center" style={{ top: "var(--safe-top)" }}>
        <span style={rise(appear(t, s + 0.4, 0.6), -20)}>
          <Tricolore width={160} height={10} />
        </span>
        <h2
          className="mt-6 font-display font-extrabold leading-[1.05] text-white"
          style={{ fontSize: f === "9x16" ? 76 : 62, ...rise(appear(t, s + 0.6, 0.6)) }}
        >
          Les 3 bons réflexes
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {REFLEXES.map((r, i) => {
            const Icon = r.icon;
            return (
              <span
                key={r.label}
                className="flex items-center gap-3 rounded-full bg-white py-3 pr-6 pl-3 font-display text-[length:var(--chip-size)] font-bold shadow-xl"
                style={{ color: NAVY, ...pop(appear(t, s + 1.1 + i * 0.25, 0.45)) }}
              >
                <span className="grid size-[48px] place-items-center rounded-full text-white" style={{ background: r.color }}>
                  <Icon size={26} strokeWidth={2.6} />
                </span>
                {r.label}
              </span>
            );
          })}
        </div>
      </div>
      <div
        className="absolute inset-x-[56px] flex flex-col items-center text-center text-white"
        style={{ bottom: "var(--final-bottom)", ...rise(appear(t, s + 2.2, 0.6)) }}
      >
        <p className="font-display text-[44px] font-extrabold leading-tight">La Police Municipale veille sur vous</p>
        <p className="mt-4 flex items-center gap-4 rounded-full bg-white px-7 py-3 font-display text-[34px] font-extrabold" style={{ color: NAVY }}>
          <PhoneCall size={34} strokeWidth={2.6} color={RED} /> Urgence : 17 · 112
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Scène                                                               */
/* ------------------------------------------------------------------ */

const FORMAT_VARS: Record<Format, Record<string, string>> = {
  "9x16": {
    "--safe-top": "150px",
    "--safe-bottom": "300px",
    "--sub-size": "46px",
    "--card-top": "830px",
    "--card-w": "984px",
    "--title-size": "58px",
    "--text-size": "36px",
    "--chip-size": "32px",
    "--picto-h": "150px",
    "--recap-top": "300px",
    "--intro-bottom": "300px",
    "--intro-size": "120px",
    "--final-bottom": "250px",
  },
  "4x5": {
    "--safe-top": "56px",
    "--safe-bottom": "56px",
    "--sub-size": "40px",
    "--card-top": "180px",
    "--card-w": "640px",
    "--title-size": "48px",
    "--text-size": "30px",
    "--chip-size": "28px",
    "--picto-h": "124px",
    "--recap-top": "190px",
    "--intro-bottom": "90px",
    "--intro-size": "104px",
    "--final-bottom": "60px",
  },
};

function ShotView({ shot, t, f, subtitles }: { shot: Shot; t: number; f: Format; subtitles: boolean }) {
  const L = layoutFor(shot.id, f);
  const lt = t - shot.start;
  const k = easeInOut(clamp01(lt / (shot.end - shot.start)));
  const c = { z: lerp(L.cam[0].z, L.cam[1].z, k), px: lerp(L.cam[0].px, L.cam[1].px, k), py: lerp(L.cam[0].py, L.cam[1].py, k) };
  const cue = cueAt(t);
  const H = STAGE_H[f];

  // Parallaxe : le décor suit la caméra plus lentement que les personnages.
  const bgZoom = L.bg.z * (shot.id === "intro" ? lerp(1, 1.1, easeOut(clamp01(lt / 5))) : 1 + (c.z - 1) * 0.45);
  const lerpPose = (p?: [Pose, Pose]) =>
    p && { x: lerp(p[0].x, p[1].x, k), y: lerp(p[0].y, p[1].y, k), h: lerp(p[0].h, p[1].h, k) };
  const child = lerpPose(L.child);
  const officer = lerpPose(L.officer);
  const tipK = (start: number) => appear(t, start, 0.5);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={L.bg.src}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
        style={{
          objectFit: "cover",
          objectPosition: `${L.bg.fx}% ${L.bg.fy}%`,
          transform: `translate(${c.px * 0.35}px, ${c.py * 0.35}px) scale(${bgZoom})`,
          transformOrigin: `${L.bg.fx}% ${L.bg.fy}%`,
        }}
      />
      {/* Lumière chaude commune : intègre les personnages détourés dans la lumière du décor */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 70% at 20% 0%, rgba(255,214,170,0.35), transparent 60%)", mixBlendMode: "soft-light" }}
      />

      <div
        className="absolute inset-0"
        style={{ transform: `translate(${c.px}px, ${c.py}px) scale(${c.z})`, transformOrigin: `50% ${H * 0.6}px` }}
      >
        {officer && (
          <Character
            asset={OFFICER}
            pose={officer}
            t={t}
            talking={cue?.speaker === "policier" && t < shot.end}
            soft={L.focus === "enfant"}
          />
        )}
        {child && (
          <Character
            asset={CHILD}
            pose={child}
            t={t + 0.7}
            talking={cue?.speaker === "enfant" && t < shot.end}
            soft={L.focus === "policier"}
            tint="sepia(0.06) saturate(1.04)"
          />
        )}
      </div>

      {/* Vignettage léger */}
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 220px rgba(10,8,30,0.35)" }} />

      {shot.id === "intro" && <IntroTitle t={t} />}
      {shot.id !== "intro" && shot.id !== "final" && <BrandChip k={appear(t, 5.2, 0.6)} />}
      {shot.id.startsWith("conseil") && <StepDots active={Number(shot.id.slice(-1))} k={tipK(shot.start + 0.2)} />}
      {shot.id === "conseil-1" && <Conseil1 t={t} />}
      {shot.id === "conseil-2" && <Conseil2 t={t} />}
      {shot.id === "conseil-3" && <Conseil3 t={t} />}
      {shot.id === "enfant-2" && <Recap t={t} />}
      {shot.id === "final" && <FinalCard t={t} f={f} />}

      <Subtitle t={t} show={subtitles && shot.id !== "intro" && shot.id !== "final"} />
    </div>
  );
}

/** Polygone du volet : bord incliné qui balaie l'écran de droite à gauche (k : 0 → 1). */
function wipeClip(k: number) {
  const x = 125 - k * 150; // en %, bord haut ; le bord bas est décalé de 25 %
  return `polygon(${x}% 0, 100% 0, 100% 100%, ${x - 25}% 100%)`;
}
function wipeBand(k: number) {
  const x = 125 - k * 150;
  return `polygon(${x - 4}% 0, ${x}% 0, ${x - 25}% 100%, ${x - 29}% 100%)`;
}

/**
 * Image de la vidéo à l'instant `t`, à la résolution native (1080 × 1920 ou 1080 × 1350).
 * Le plan précédent reste affiché sous le plan courant le temps de la transition.
 */
export function PreventionScene({ t, format, subtitles = true }: { t: number; format: Format; subtitles?: boolean }) {
  const i = shotAt(t);
  const shot = SHOTS[i];
  const prev = i > 0 ? SHOTS[i - 1] : undefined;
  const tr = shot.transition;
  const k = tr.type === "cut" ? 1 : clamp01((t - shot.start) / tr.dur);
  const end = 1 - clamp01((t - (SHOTS[SHOTS.length - 1].end - 0.8)) / 0.8);
  const vars = FORMAT_VARS[format] as CSSProperties;

  return (
    <div
      className="relative overflow-hidden font-sans"
      style={{ width: STAGE_W, height: STAGE_H[format], background: "#0b1230", ...vars }}
    >
      {tr.type === "wipe" && prev && k < 1 ? (
        <>
          <ShotView shot={prev} t={t} f={format} subtitles={subtitles} />
          {/* Volet diagonal : le nouveau plan est révélé de droite à gauche, souligné d'une bande bleue */}
          <div className="absolute inset-0" style={{ clipPath: wipeClip(easeInOut(k)) }}>
            <ShotView shot={shot} t={t} f={format} subtitles={subtitles} />
          </div>
          <div className="absolute inset-0" style={{ background: BLUE, clipPath: wipeBand(easeInOut(k)) }} />
        </>
      ) : tr.type === "dip" && prev && k < 1 ? (
        <>
          {k < 0.5 ? (
            <ShotView shot={prev} t={t} f={format} subtitles={subtitles} />
          ) : (
            <ShotView shot={shot} t={t} f={format} subtitles={subtitles} />
          )}
          <div className="absolute inset-0" style={{ background: "#0b1230", opacity: 1 - Math.abs(k - 0.5) * 2 }} />
        </>
      ) : (
        <ShotView shot={shot} t={t} f={format} subtitles={subtitles} />
      )}
      {/* Fondu au noir de fin (boucle propre en mode démonstration) */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "#0b1230", opacity: 1 - end }} />
    </div>
  );
}
