import "server-only";
import { Image } from "@react-pdf/renderer";
import { COLORS, Document, StandardPage, Table, Text, View, date, money, s, t } from "@/lib/pdf/base";
import { AUDIT_CATEGORIES, RECO_HORIZON, RECO_PRIORITY, RECO_STATUS, labelOf } from "@/lib/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServerSupabase } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES } from "./default-template";
import { CONFORMITY_LABELS, conformityByCategory, parseScoring, riskLevel, type Answer, type Question, type ScoringMethod } from "./scoring";

const LEVEL_COLORS: Record<string, string> = { success: "#2E8B57", gold: "#B08A3E", warning: "#C77700", danger: "#B42318" };

/** Charge les données du rapport avec le client de l'utilisateur (RLS appliquée). */
export async function loadAuditReport(supabase: ServerSupabase, auditId: string) {
  const { data: audit } = await supabase
    .from("audits")
    .select("*, clients(name, address_line, postal_code, city), missions(reference, title), audit_templates(questions, categories, scoring), auditor:profiles!audits_auditor_id_fkey(full_name), validator:profiles!audits_validated_by_fkey(full_name), organizations(name, legal_name, siren, email, phone, city)")
    .eq("id", auditId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!audit) return null;
  const [obs, risks, recos] = await Promise.all([
    supabase.from("audit_observations").select("*").eq("audit_id", auditId).order("position").order("created_at"),
    supabase.from("risk_assessments").select("*").eq("audit_id", auditId).order("score", { ascending: false }),
    supabase.from("recommendations").select("*").eq("audit_id", auditId).order("priority").order("created_at"),
  ]);

  // Photos (accès déjà vérifié par la RLS sur les constats) : JPEG/PNG uniquement, 12 maximum.
  const admin = createAdminClient();
  const photos: Array<{ observation: string; data: Buffer; format: "jpg" | "png" }> = [];
  for (const o of obs.data ?? []) {
    for (const p of o.photo_paths) {
      if (photos.length >= 12) break;
      const format = p.endsWith(".png") ? "png" : p.endsWith(".jpg") ? "jpg" : null;
      if (!format) continue;
      const { data } = await admin.storage.from("audit-photos").download(p);
      if (data) photos.push({ observation: o.title, data: Buffer.from(await data.arrayBuffer()), format });
    }
  }
  return { audit, observations: obs.data ?? [], risks: risks.data ?? [], recommendations: recos.data ?? [], photos };
}

type ReportData = NonNullable<Awaited<ReturnType<typeof loadAuditReport>>>;

export function AuditReportDocument({ data }: { data: ReportData }) {
  const { audit, observations, risks, recommendations, photos } = data;
  const tpl = audit.audit_templates as { questions: unknown; categories: unknown; scoring: unknown } | null;
  const method: ScoringMethod = parseScoring(audit.scoring_snapshot ?? tpl?.scoring);
  const questions = (Array.isArray(tpl?.questions) ? tpl.questions : []) as Question[];
  const cats = ((Array.isArray(tpl?.categories) && tpl.categories.length ? tpl.categories : DEFAULT_CATEGORIES) as Array<{ key: string; label: string }>).map((c) => ({
    key: c.key,
    label: AUDIT_CATEGORIES[c.key]?.label ?? c.label,
  }));
  const answers = (audit.answers ?? {}) as Record<string, Answer>;
  const conformity = conformityByCategory(questions, answers);
  const client = audit.clients as { name: string; address_line: string | null; postal_code: string | null; city: string | null } | null;
  const org = audit.organizations as { name: string; legal_name: string | null; siren: string | null; email: string | null; phone: string | null } | null;
  const validated = audit.status === "valide";
  const header = `${audit.reference} - ${client?.name ?? ""}`;
  const footer = `${org?.name ?? "NOAMIS"} - Rapport d'audit de sûreté`;
  const watermark = validated ? undefined : "INDICATIF";

  return (
    <Document title={t(`Rapport d'audit ${audit.reference}`)} author={t(org?.name ?? "NOAMIS")} subject="Audit de sûreté" creator="NOAMIS 360°" producer="NOAMIS 360°">
      {/* Couverture */}
      <StandardPage header={header} footer={footer} watermark={watermark}>
        <View style={{ marginTop: 90 }}>
          <Text style={{ fontSize: 9, letterSpacing: 3, color: COLORS.gold, fontFamily: "Helvetica-Bold" }}>RAPPORT D&apos;AUDIT DE SÛRETÉ</Text>
          <Text style={{ fontSize: 26, lineHeight: 1.25, fontFamily: "Helvetica-Bold", color: COLORS.black, marginTop: 12 }}>{t(audit.title)}</Text>
          <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 14 }}>{t(client?.name)}</Text>
          <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: COLORS.gold, paddingTop: 14, gap: 4 }}>
            <Text>Référence : {t(audit.reference)}{audit.missions ? ` - Mission ${t((audit.missions as { reference: string }).reference)}` : ""}</Text>
            <Text>Site : {t(audit.site_name ?? "-")}{audit.site_address ? ` (${t(audit.site_address)})` : ""}</Text>
            <Text>Date de visite : {date(audit.audit_date)}</Text>
            <Text>Consultant : {t((audit.auditor as { full_name: string | null } | null)?.full_name ?? "-")}</Text>
            <Text>Statut : {validated ? `Validé le ${date(audit.validated_at)} par ${t((audit.validator as { full_name: string | null } | null)?.full_name ?? "-")}` : "PROJET - résultats indicatifs, non validés"}</Text>
          </View>
          {!validated && (
            <View style={[s.box, { marginTop: 24, borderLeftColor: "#C77700" }]}>
              <Text style={s.bold}>Document provisoire</Text>
              <Text>Les cotations et niveaux de risque présentés sont calculés automatiquement et restent indicatifs jusqu&apos;à validation par un consultant NOAMIS.</Text>
            </View>
          )}
          <View style={[s.box, { marginTop: 24 }]}>
            <Text style={s.bold}>Confidentialité</Text>
            <Text>Ce rapport décrit des vulnérabilités de sûreté. Il est strictement réservé au destinataire et ne doit pas être diffusé, publié ni transmis sans autorisation.</Text>
          </View>
        </View>
      </StandardPage>

      <StandardPage header={header} footer={footer} watermark={watermark}>
        <Text style={s.h1}>Synthèse</Text>
        <Text style={s.p}>{t(audit.summary || "Synthèse à rédiger.")}</Text>
        {audit.context ? (
          <>
            <Text style={s.h2}>Contexte et périmètre</Text>
            <Text style={s.p}>{t(audit.context)}</Text>
          </>
        ) : null}
        <Text style={s.h2}>Méthodologie</Text>
        <Text style={s.p}>{t(audit.methodology || "")}</Text>
        <Text style={s.p}>Méthode de cotation : {t(method.name)}. Score = vraisemblance ({method.likelihood.min}-{method.likelihood.max}) x gravité ({method.impact.min}-{method.impact.max}).</Text>
        <Table
          cols={[{ label: "Niveau", width: "40%" }, { label: "Score", width: "60%" }]}
          rows={method.levels.map((l) => [l.label, `${l.min} à ${l.max}`])}
        />

        <Text style={s.h2}>Conformité par domaine (indicative)</Text>
        <Table
          cols={[{ label: "Domaine", width: "55%" }, { label: "Questions renseignées", width: "25%", align: "right" }, { label: "Conformité", width: "20%", align: "right" }]}
          rows={cats.map((c) => [c.label, `${conformity[c.key]?.answered ?? 0} / ${conformity[c.key]?.total ?? 0}`, conformity[c.key]?.rate === null || conformity[c.key]?.rate === undefined ? "-" : `${conformity[c.key]!.rate} %`])}
        />
      </StandardPage>

      <StandardPage header={header} footer={footer} watermark={watermark}>
        <Text style={s.h1}>Constats</Text>
        {observations.length === 0 && <Text style={s.muted}>Aucun constat consigné.</Text>}
        {observations.map((o, i) => (
          <View key={o.id} wrap={false} style={{ marginBottom: 8 }}>
            <Text style={s.h3}>{i + 1}. {t(o.title)}{o.is_vulnerability ? " - vulnérabilité" : ""}</Text>
            <Text style={[s.small, s.muted]}>{t(labelOf(AUDIT_CATEGORIES, o.category))}{o.location ? ` - ${t(o.location)}` : ""}</Text>
            {o.description ? <Text style={s.p}>{t(o.description)}</Text> : null}
          </View>
        ))}

        <Text style={s.h2}>Évaluation des risques</Text>
        <Table
          cols={[
            { label: "Menace / scénario", width: "30%" },
            { label: "V", width: "6%", align: "center" },
            { label: "G", width: "6%", align: "center" },
            { label: "Score", width: "9%", align: "center" },
            { label: "Niveau", width: "13%" },
            { label: "Justification", width: "36%" },
          ]}
          rows={risks.map((r) => {
            const lv = riskLevel(method, r.score ?? r.likelihood * r.impact);
            return [
              `${t(r.threat)}\n${t(labelOf(AUDIT_CATEGORIES, r.category))}`,
              String(r.likelihood),
              String(r.impact),
              String(r.score),
              <Text key="l" style={{ color: LEVEL_COLORS[lv.tone], fontFamily: "Helvetica-Bold" }}>{t(r.level)}{r.is_validated ? "" : " (indicatif)"}</Text>,
              t(r.justification),
            ];
          })}
        />
        {risks.some((r) => Object.values((r.criteria ?? {}) as Record<string, string | null>).some(Boolean)) && (
          <>
            <Text style={s.h3}>Critères d&apos;appréciation</Text>
            {risks.map((r) => {
              const crit = (r.criteria ?? {}) as Record<string, string | null>;
              const entries = method.criteria.filter((c) => crit[c.key]);
              if (!entries.length) return null;
              return (
                <View key={r.id} style={{ marginBottom: 4 }} wrap={false}>
                  <Text style={s.bold}>{t(r.threat)}</Text>
                  {entries.map((c) => <Text key={c.key} style={s.small}>- {t(c.label)} : {t(crit[c.key])}</Text>)}
                </View>
              );
            })}
          </>
        )}
      </StandardPage>

      <StandardPage header={header} footer={footer} watermark={watermark}>
        <Text style={s.h1}>Recommandations et plan d&apos;actions</Text>
        <Text style={[s.p, s.muted]}>Priorités : P1 urgent, P2 prioritaire, P3 recommandé, P4 amélioration. Les coûts sont des estimations indicatives ; le choix et la mise en œuvre des solutions relèvent du client et des prestataires qu&apos;il retient.</Text>
        <Table
          cols={[{ label: "Prio.", width: "9%" }, { label: "Recommandation", width: "45%" }, { label: "Horizon", width: "16%" }, { label: "Coût estimé", width: "15%", align: "right" }, { label: "Suivi", width: "15%" }]}
          rows={recommendations.map((r) => [
            r.priority,
            `${t(r.title)}${r.description ? `\n${t(r.description)}` : ""}`,
            t(labelOf(RECO_HORIZON, r.horizon)),
            money(r.estimated_cost),
            t(RECO_STATUS[r.status]?.label ?? r.status),
          ])}
        />
        <Text style={[s.small, s.muted]}>{t(Object.values(RECO_PRIORITY).map((p) => p.label).join(" - "))}</Text>
      </StandardPage>

      <StandardPage header={header} footer={footer} watermark={watermark}>
        <Text style={s.h1}>Annexes</Text>
        <Text style={s.h2}>A. Questionnaire</Text>
        {cats.map((c) => {
          const qs = questions.filter((q) => q.category === c.key);
          if (!qs.length) return null;
          return (
            <View key={c.key}>
              <Text style={s.h3}>{t(c.label)}</Text>
              <Table
                cols={[{ label: "Point de contrôle", width: "55%" }, { label: "Réponse", width: "18%" }, { label: "Observation", width: "27%" }]}
                rows={qs.map((q) => [t(q.label), answers[q.id]?.value ? t(CONFORMITY_LABELS[answers[q.id]!.value!]) : "-", t(answers[q.id]?.comment ?? "")])}
              />
            </View>
          );
        })}
        {photos.length > 0 && (
          <>
            <Text style={s.h2} break>B. Photographies</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {photos.map((p, i) => (
                <View key={i} style={{ width: "47%" }} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- composant PDF (react-pdf), sans attribut alt ; légende fournie dessous */}
                  <Image src={{ data: p.data, format: p.format }} style={{ width: "100%", maxHeight: 200, objectFit: "contain" }} />
                  <Text style={[s.small, s.muted]}>Photo {i + 1} - {t(p.observation)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <Text style={s.h2}>C. Mentions</Text>
        <Text style={s.small}>{t(org?.legal_name ?? org?.name ?? "")}{org?.siren ? ` - SIREN ${t(org.siren)}` : ""}{org?.email ? ` - ${t(org.email)}` : ""}. NOAMIS est un conseil indépendant : il ne vend ni n&apos;installe d&apos;équipements. Rapport généré le {date(new Date().toISOString())} avec NOAMIS 360°.</Text>
      </StandardPage>
    </Document>
  );
}
