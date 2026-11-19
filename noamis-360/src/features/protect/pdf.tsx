import "server-only";
import { COLORS, Document, StandardPage, Table, Text, View, date, s, t } from "@/lib/pdf/base";
import { ANSWER_LABELS, AUDIENCES, DISCLAIMER, LEVEL_LABELS, QUESTIONS, type Audience, type ProtectAnswer, type ProtectResult } from "./questionnaire";

/** Synthèse PDF du diagnostic préliminaire (générée à la volée, non conservée). */
export function ProtectPdf({ audience, answers, result }: { audience: Audience; answers: Record<string, ProtectAnswer>; result: ProtectResult }) {
  return (
    <Document title="Diagnostic préliminaire NOAMIS PROTECT" creator="NOAMIS 360°">
      <StandardPage header="Diagnostic préliminaire" footer="NOAMIS PROTECT - auto-évaluation indicative" confidential={false}>
        <Text style={{ fontSize: 9, letterSpacing: 3, color: COLORS.gold, fontFamily: "Helvetica-Bold" }}>NOAMIS PROTECT</Text>
        <Text style={[s.h1, { marginTop: 6 }]}>Synthèse de votre diagnostic préliminaire</Text>
        <Text style={s.muted}>Profil : {t(AUDIENCES[audience].label)} - établi le {date(new Date().toISOString())}</Text>
        <View style={[s.box, { borderLeftColor: "#C77700" }]}>
          <Text style={s.bold}>À lire avant tout</Text>
          <Text>{t(DISCLAIMER)}</Text>
        </View>
        <Text style={s.h2}>Résultat indicatif</Text>
        <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold" }}>{result.score} / 100 - {t(LEVEL_LABELS[result.level])}</Text>
        <Table cols={[{ label: "Thème", width: "70%" }, { label: "Indice", width: "30%", align: "right" }]} rows={result.byTheme.map((x) => [x.theme, `${x.score} / 100`])} />
        <Text style={s.h2}>Pistes d&apos;amélioration générales</Text>
        {result.recommendations.length === 0 && <Text>Vos réponses ne font pas apparaître de piste prioritaire. Un regard extérieur reste utile pour confirmer cette appréciation.</Text>}
        {result.recommendations.map((r, i) => (
          <Text key={i} style={{ marginBottom: 4 }}>- [{r.priority === "haute" ? "Priorité" : "À considérer"}] {t(r.theme)} : {t(r.text)}</Text>
        ))}
        <Text style={s.h2}>Vos réponses</Text>
        <Table cols={[{ label: "Question", width: "78%" }, { label: "Réponse", width: "22%" }]} rows={QUESTIONS[audience].map((q) => [t(q.label), t(ANSWER_LABELS[answers[q.id] ?? "ne_sait_pas"])])} />
        <Text style={[s.small, s.muted, { marginTop: 10 }]}>
          NOAMIS Sûreté Conseil est un conseil indépendant : il ne vend ni n&apos;installe d&apos;équipements. Pour une étude adaptée à votre situation, contactez-nous via www.noamis.fr.
        </Text>
      </StandardPage>
    </Document>
  );
}
