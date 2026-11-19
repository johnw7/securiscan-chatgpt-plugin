import "server-only";
import { COLORS, Document, StandardPage, Table, Text, View, date, s, t } from "@/lib/pdf/base";
import { REPORT_KINDS, SEVERITY } from "@/lib/labels";

type Ref = { title: string; url: string; date: string; source: string; reliability: string; credibility: number };
export type ReportPdfData = {
  kind: string;
  title: string;
  summary: string | null;
  body: string | null;
  severity: string | null;
  status: string;
  ai_generated: boolean;
  themes: string[];
  validated_at: string | null;
  created_at: string;
  source_refs: unknown;
};

/** Fiche / bulletin / alerte de veille en PDF, avec références datées. */
export function IntelligencePdf({ report, organization }: { report: ReportPdfData; organization: string }) {
  const refs = (Array.isArray(report.source_refs) ? report.source_refs : []) as Ref[];
  const validated = report.status === "valide" || report.status === "diffuse";
  return (
    <Document title={t(report.title)} creator="NOAMIS 360°">
      <StandardPage header={REPORT_KINDS[report.kind]?.label ?? "Veille"} footer={`${organization} - NOAMIS INTELLIGENCE`} watermark={validated ? undefined : "BROUILLON"}>
        <Text style={{ fontSize: 9, letterSpacing: 3, color: COLORS.gold, fontFamily: "Helvetica-Bold" }}>{t((REPORT_KINDS[report.kind]?.label ?? "").toUpperCase())}</Text>
        <Text style={[s.h1, { marginTop: 6 }]}>{t(report.title)}</Text>
        <Text style={s.muted}>
          {date(validated ? report.validated_at : report.created_at)}
          {report.severity ? ` - niveau : ${t(SEVERITY[report.severity]?.label)}` : ""}
          {report.themes.length ? ` - ${t(report.themes.join(", "))}` : ""}
        </Text>
        {!validated && (
          <View style={[s.box, { borderLeftColor: "#C77700" }]}>
            <Text>Document non validé : ne pas diffuser.{report.ai_generated ? " Contenu généré par IA, à vérifier." : ""}</Text>
          </View>
        )}
        {report.summary ? (
          <View style={s.box}>
            <Text>{t(report.summary)}</Text>
          </View>
        ) : null}
        <Text style={s.p}>{t(report.body ?? "")}</Text>
        <Text style={s.h2}>Références</Text>
        <Table
          cols={[{ label: "N°", width: "6%" }, { label: "Titre et lien", width: "54%" }, { label: "Source", width: "20%" }, { label: "Date", width: "10%" }, { label: "Éval.", width: "10%" }]}
          rows={refs.map((r, i) => [`[${i + 1}]`, `${t(r.title)}\n${t(r.url)}`, t(r.source), date(r.date), `${r.reliability}${r.credibility}`])}
        />
        <Text style={[s.small, s.muted]}>
          Évaluation selon le code de l&apos;Amirauté : fiabilité de la source (A à F) et crédibilité de l&apos;information (1 à 6). Les faits rapportés sont distingués des
          hypothèses ; cette analyse ne constitue pas une alerte officielle.
        </Text>
      </StandardPage>
    </Document>
  );
}
