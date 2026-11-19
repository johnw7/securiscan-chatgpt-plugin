import "server-only";
import ExcelJS from "exceljs";
import { COLORS, Document, StandardPage, Table, Text, View, date, money, s, t } from "@/lib/pdf/base";
import { PROJECT_PHASES, labelOf } from "@/lib/labels";
import type { ServerSupabase } from "@/lib/supabase/server";
import { rankOffers, totalWeight } from "./comparison";

export async function loadComparison(supabase: ServerSupabase, projectId: string) {
  const { data: project } = await supabase
    .from("projects")
    .select("id, reference, name, phase, budget, clients(name), organizations(name)")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;
  const [{ data: criteria }, { data: offers }] = await Promise.all([
    supabase.from("selection_criteria").select("id, label, weight").eq("project_id", projectId).order("position"),
    supabase.from("vendor_offers").select("id, amount_ht, delay_weeks, scores, is_selected, strengths, weaknesses, vendors(name)").eq("project_id", projectId),
  ]);
  const crit = (criteria ?? []).map((c) => ({ id: c.id, label: c.label, weight: Number(c.weight) }));
  const ranked = rankOffers(
    (offers ?? []).map((o) => ({
      id: o.id,
      vendor: (o.vendors as { name: string } | null)?.name ?? "-",
      amount_ht: Number(o.amount_ht),
      delay_weeks: o.delay_weeks,
      scores: (o.scores ?? {}) as Record<string, number>,
    })),
    crit,
  );
  const meta = new Map((offers ?? []).map((o) => [o.id, o]));
  return { project, criteria: crit, ranked, meta };
}

type Data = NonNullable<Awaited<ReturnType<typeof loadComparison>>>;

export function ComparisonPdf({ data }: { data: Data }) {
  const { project, criteria, ranked, meta } = data;
  const client = (project.clients as { name: string } | null)?.name ?? "";
  const width = `${Math.floor(60 / Math.max(ranked.length, 1))}%`;
  return (
    <Document title={t(`Comparatif des offres ${project.reference}`)} creator="NOAMIS 360°">
      <StandardPage header={`${project.reference} - ${client}`} footer="Tableau comparatif des propositions">
        <Text style={s.h1}>Tableau comparatif des propositions</Text>
        <Text style={s.muted}>
          {t(project.name)} - {t(client)} - étape : {t(labelOf(PROJECT_PHASES, project.phase))} - édité le {date(new Date().toISOString())}
        </Text>
        <Text style={s.h2}>Synthèse et classement</Text>
        <Table
          cols={[
            { label: "Rang", width: "14%" },
            { label: "Prestataire", width: "36%" },
            { label: "Montant HT", width: "20%", align: "right" },
            { label: "Délai", width: "12%", align: "right" },
            { label: "Note /10", width: "18%", align: "right" },
          ]}
          rows={ranked.map((o) => [
            `#${o.rank}${meta.get(o.id)?.is_selected ? " (retenue)" : ""}`,
            o.vendor,
            money(o.amount_ht),
            o.delay_weeks !== null ? `${o.delay_weeks} sem.` : "-",
            `${o.weighted.toFixed(2)}${o.complete ? "" : " *"}`,
          ])}
        />
        <Text style={s.h2}>Notation détaillée (sur 10)</Text>
        <Table
          cols={[{ label: "Critère", width: "28%" }, { label: "Poids", width: "12%", align: "right" }, ...ranked.map((o) => ({ label: o.vendor, width, align: "right" as const }))]}
          rows={[
            ...criteria.map((c) => [c.label, `${c.weight} %`, ...ranked.map((o) => (typeof o.scores[c.id] === "number" ? String(o.scores[c.id]) : "-"))]),
            ["Note pondérée", `${totalWeight(criteria)} %`, ...ranked.map((o) => o.weighted.toFixed(2))],
          ]}
        />
        <Text style={[s.small, s.muted]}>* notation incomplète. Note pondérée = somme(note x poids) / somme(poids).</Text>
        <Text style={s.h2}>Points forts et points de vigilance</Text>
        {ranked.map((o) => {
          const m = meta.get(o.id);
          return (
            <View key={o.id} style={{ marginBottom: 6 }} wrap={false}>
              <Text style={s.bold}>{t(o.vendor)}</Text>
              <Text>Points forts : {t(m?.strengths ?? "-")}</Text>
              <Text>Vigilance : {t(m?.weaknesses ?? "-")}</Text>
            </View>
          );
        })}
        <View style={[s.box, { borderLeftColor: COLORS.gold }]}>
          <Text>
            Ce comparatif est une aide à la décision. Le choix du prestataire et la contractualisation relèvent du client. NOAMIS ne perçoit aucune
            rémunération des prestataires.
          </Text>
        </View>
      </StandardPage>
    </Document>
  );
}

export async function comparisonWorkbook(data: Data): Promise<Buffer> {
  const { project, criteria, ranked } = data;
  const wb = new ExcelJS.Workbook();
  wb.creator = "NOAMIS 360°";
  wb.created = new Date();
  const ws = wb.addWorksheet("Comparatif", { views: [{ state: "frozen", xSplit: 2, ySplit: 4 }] });
  ws.getCell("A1").value = `Comparatif des offres — ${project.reference} — ${project.name}`;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF101113" } };
  ws.getCell("A2").value = `Client : ${(project.clients as { name: string } | null)?.name ?? ""} — édité le ${new Date().toLocaleDateString("fr-FR")}`;

  const headerRow = ws.getRow(4);
  headerRow.values = ["Critère", "Poids (%)", ...ranked.map((o) => o.vendor)];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B1C1E" } };
  });

  const amountRow = ws.addRow(["Montant HT (€)", null, ...ranked.map((o) => o.amount_ht)]);
  ws.addRow(["Délai (semaines)", null, ...ranked.map((o) => o.delay_weeks)]);
  for (const c of criteria) {
    ws.addRow([c.label, c.weight, ...ranked.map((o) => (typeof o.scores[c.id] === "number" ? o.scores[c.id] : null))]);
  }
  const critStart = amountRow.number + 2;
  const critEnd = critStart + criteria.length - 1;

  // Note pondérée recalculée par formule Excel (transparence du calcul).
  const totalRow = ws.addRow(["Note pondérée /10", criteria.reduce((sum, c) => sum + c.weight, 0)]);
  ranked.forEach((offer, i) => {
    const col = ws.getColumn(3 + i).letter;
    const cell = totalRow.getCell(3 + i);
    cell.value = criteria.length
      ? { formula: `SUMPRODUCT(${col}${critStart}:${col}${critEnd},$B$${critStart}:$B$${critEnd})/SUM($B$${critStart}:$B$${critEnd})`, result: offer.weighted }
      : 0;
    cell.numFmt = "0.00";
  });
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3E9D2" } };
  });
  amountRow.eachCell((cell, n) => {
    if (n > 2) cell.numFmt = '#,##0.00 "€"';
  });
  ws.columns.forEach((column, i) => {
    column.width = i === 0 ? 46 : 18;
  });
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
