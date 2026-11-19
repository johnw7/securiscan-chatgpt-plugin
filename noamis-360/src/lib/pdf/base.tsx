import { Document, Page, Path, StyleSheet, Svg, Circle, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement, ReactNode } from "react";

/**
 * Socle commun des documents PDF NOAMIS (police standard Helvetica, encodage
 * WinAnsi : tout texte passe par `t()` pour neutraliser les caractères non
 * représentables).
 */
export const COLORS = { black: "#101113", black2: "#1B1C1E", gold: "#C7A15B", goldLight: "#E5C27B", white: "#FFFFFF", grey: "#AFAFAF", text: "#1B1C1E", muted: "#5B5D61", line: "#E3DED3", soft: "#F6F3EC" };

const WINANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
export function t(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u202f\u00a0\u2009]/g, " ")
    .replace(/[\u2192]/g, "->")
    .replace(/[\u2265]/g, ">=")
    .replace(/[\u2264]/g, "<=")
    .replace(/[\u2713\u2714]/g, "x")
    .replace(/./gu, (ch) => {
      const code = ch.codePointAt(0)!;
      if (code === 10 || code === 9) return ch;
      if (code < 32) return "";
      if (code <= 0xff || WINANSI_EXTRA.has(ch)) return ch;
      return "?";
    });
}

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const money = (v: number | string | null | undefined) => (v === null || v === undefined || v === "" ? "-" : t(eur.format(Number(v))));
export const date = (v: string | null | undefined) => {
  if (!v) return "-";
  const d = new Date(v.length === 10 ? `${v}T12:00:00Z` : v);
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(d);
};

export const s = StyleSheet.create({
  page: { paddingTop: 70, paddingBottom: 60, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 9.5, color: COLORS.text, lineHeight: 1.45 },
  header: { position: "absolute", top: 22, left: 44, right: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 0.6, borderBottomColor: COLORS.gold, paddingBottom: 8 },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 11, color: COLORS.black, letterSpacing: 1 },
  brandSub: { fontSize: 6.5, color: COLORS.muted, letterSpacing: 2 },
  footer: { position: "absolute", bottom: 22, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: COLORS.muted, borderTopWidth: 0.4, borderTopColor: COLORS.line, paddingTop: 6 },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 18, color: COLORS.black, marginBottom: 6 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 13, color: COLORS.black, marginTop: 16, marginBottom: 8, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: COLORS.gold },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: COLORS.black, marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 6 },
  muted: { color: COLORS.muted },
  small: { fontSize: 8 },
  bold: { fontFamily: "Helvetica-Bold" },
  table: { borderWidth: 0.5, borderColor: COLORS.line, marginVertical: 6 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COLORS.line },
  th: { backgroundColor: COLORS.black2, color: COLORS.white, fontFamily: "Helvetica-Bold", fontSize: 8, padding: 5 },
  td: { padding: 5, fontSize: 8.5 },
  box: { backgroundColor: COLORS.soft, borderLeftWidth: 3, borderLeftColor: COLORS.gold, padding: 10, marginVertical: 8 },
  watermark: { position: "absolute", top: 330, left: 60, fontSize: 64, color: "#C7A15B", opacity: 0.12, transform: "rotate(-30deg)", fontFamily: "Helvetica-Bold" },
});

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="22" stroke={COLORS.gold} strokeWidth={3.5} fill="none" strokeDasharray="118 20" />
      <Path d="M24 41V23l16 18V23" stroke={COLORS.black} strokeWidth={3.5} fill="none" />
    </Svg>
  );
}

export function Header({ right }: { right: string }) {
  return (
    <View style={s.header} fixed>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <LogoMark />
        <View>
          <Text style={s.brand}>NOAMIS 360°</Text>
          <Text style={s.brandSub}>SÛRETÉ CONSEIL</Text>
        </View>
      </View>
      <Text style={[s.small, s.muted]}>{t(right)}</Text>
    </View>
  );
}

export function Footer({ left, confidential = true }: { left: string; confidential?: boolean }) {
  return (
    <View style={s.footer} fixed>
      <Text>{t(left)}{confidential ? " - Document confidentiel, diffusion restreinte" : ""}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function StandardPage({ header, footer, children, watermark, confidential }: { header: string; footer: string; children: ReactNode; watermark?: string; confidential?: boolean }) {
  return (
    <Page size="A4" style={s.page}>
      <Header right={header} />
      {watermark && <Text style={s.watermark} fixed>{t(watermark)}</Text>}
      {children}
      <Footer left={footer} confidential={confidential} />
    </Page>
  );
}

export type Col = { label: string; width: string; align?: "left" | "right" | "center" };
export function Table({ cols, rows }: { cols: Col[]; rows: Array<Array<ReactNode>> }) {
  return (
    <View style={s.table}>
      <View style={s.tr} fixed>
        {cols.map((c) => (
          <Text key={c.label} style={[s.th, { width: c.width, textAlign: c.align ?? "left" }]}>{t(c.label)}</Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[s.tr, { backgroundColor: i % 2 ? "#FBFAF7" : COLORS.white }]} wrap={false}>
          {r.map((cell, j) => (
            <View key={j} style={[s.td, { width: cols[j]!.width }]}>
              {typeof cell === "string" || typeof cell === "number" ? <Text style={{ textAlign: cols[j]!.align ?? "left" }}>{t(cell)}</Text> : cell}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export async function renderPdf(doc: ReactElement): Promise<Buffer> {
  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}

export function pdfResponse(buffer: Buffer, fileName: string, inline = true): Response {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export { Document, Page, Text, View };
