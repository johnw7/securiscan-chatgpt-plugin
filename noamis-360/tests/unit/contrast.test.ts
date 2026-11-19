/**
 * Accessibilité (WCAG 2.2 AA) : contraste des couleurs de la charte NOAMIS,
 * lues directement dans globals.css pour les deux thèmes.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");

function tokens(selector: RegExp): Record<string, string> {
  const block = css.match(selector)?.[1] ?? "";
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]));
}
const dark = tokens(/:root,\s*\[data-theme="dark"\]\s*\{([^}]+)\}/);
const light = tokens(/\[data-theme="light"\]\s*\{([^}]+)\}/);

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
}

describe("Palette obligatoire", () => {
  it("utilise exactement les couleurs NOAMIS du cahier des charges", () => {
    expect(dark).toMatchObject({ background: "#101113", surface: "#1b1c1e", gold: "#c7a15b", "gold-light": "#e5c27b", foreground: "#ffffff", muted: "#afafaf" });
  });
});

describe.each([
  ["sombre", dark],
  ["clair", light],
])("Thème %s — contrastes AA", (_name, t) => {
  const surfaces = ["background", "surface", "surface-2"];
  it.each(surfaces)("texte principal et secondaire sur %s ≥ 4,5:1", (s) => {
    expect(contrast(t.foreground!, t[s]!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.muted!, t[s]!)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(surfaces)("texte or et états (succès, alerte, erreur, info) sur %s ≥ 4,5:1", (s) => {
    for (const k of ["gold-text", "success", "warning", "danger", "info"]) expect(contrast(t[k]!, t[s]!), k).toBeGreaterThanOrEqual(4.5);
  });
  it("texte des boutons principaux (noir sur or) ≥ 4,5:1", () => {
    expect(contrast(t["on-gold"]!, t.gold!)).toBeGreaterThanOrEqual(4.5);
  });
  it("indicateur de focus ≥ 3:1 sur le fond", () => {
    expect(contrast(t.ring!, t.background!)).toBeGreaterThanOrEqual(3);
  });
});
