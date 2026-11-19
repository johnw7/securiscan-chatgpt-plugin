import "server-only";
import { COLORS, Document, StandardPage, Table, Text, View, date, money, s, t } from "@/lib/pdf/base";
import type { ServerSupabase } from "@/lib/supabase/server";

type Party = {
  name?: string | null; legal_name?: string | null; legal_form?: string | null; siren?: string | null; siret?: string | null; vat_number?: string | null;
  rcs?: string | null; address_line?: string | null; postal_code?: string | null; city?: string | null; country?: string | null; email?: string | null;
  phone?: string | null; iban?: string | null; bic?: string | null; vat_regime?: string | null; category?: string | null;
};

export type FinanceDoc = {
  type: "quote" | "invoice";
  kind: "devis" | "facture" | "avoir";
  number: string | null;
  status: string;
  title: string;
  client_id: string;
  mission_id: string | null;
  issue_date: string | null;
  due_date: string | null;
  service_date: string | null;
  valid_until: string | null;
  introduction: string | null;
  terms: string | null;
  payment_terms: string | null;
  notes: string | null;
  discount_rate: number;
  totals: { subtotal_ht: string; discount_amount: string; total_ht: string; total_vat: string; total_ttc: string; amount_paid?: string; amount_credited?: string };
  vat_breakdown: Array<{ rate: number; base: string; vat: string }>;
  lines: Array<{ description: string; quantity: number; unit: string; unit_price: number; discount_rate: number; vat_rate: number; total_ht: number }>;
  seller: Party;
  client: Party;
  mentions: Record<string, string | null>;
  invoiceSettings: Record<string, unknown>;
};

const n = (v: unknown) => Number(v ?? 0);

/** Charge un devis ou une facture (RLS appliquée) avec les informations légales. */
export async function loadFinanceDocument(supabase: ServerSupabase, type: "quote" | "invoice", id: string): Promise<FinanceDoc | null> {
  if (type === "quote") {
    const { data: q } = await supabase.from("quotes").select("*, clients(*), organizations(*), quote_items(*)").eq("id", id).maybeSingle();
    if (!q) return null;
    const org = q.organizations as unknown as Party & { invoice_settings: Record<string, unknown> };
    return {
      type, kind: "devis", number: q.number, status: q.status, title: q.title, client_id: q.client_id, mission_id: q.mission_id,
      issue_date: q.issue_date, due_date: null, service_date: null, valid_until: q.valid_until, introduction: q.introduction, terms: q.terms,
      payment_terms: q.payment_terms, notes: null, discount_rate: n(q.discount_rate),
      totals: { subtotal_ht: String(q.subtotal_ht), discount_amount: String(q.discount_amount), total_ht: String(q.total_ht), total_vat: String(q.total_vat), total_ttc: String(q.total_ttc) },
      vat_breakdown: (q.vat_breakdown ?? []) as FinanceDoc["vat_breakdown"],
      lines: [...(q.quote_items ?? [])].sort((a, b) => a.position - b.position).map((l) => ({ ...l, quantity: n(l.quantity), unit_price: n(l.unit_price), discount_rate: n(l.discount_rate), vat_rate: n(l.vat_rate), total_ht: n(l.total_ht) })),
      seller: org, client: q.clients as unknown as Party,
      mentions: { vat: org.vat_regime === "franchise" ? "TVA non applicable, art. 293 B du CGI" : null },
      invoiceSettings: org.invoice_settings ?? {},
    };
  }
  const { data: v } = await supabase.from("invoices").select("*, clients(*), organizations(*), invoice_items(*)").eq("id", id).maybeSingle();
  if (!v) return null;
  const org = v.organizations as unknown as Party & { invoice_settings: Record<string, unknown> };
  const issued = v.status !== "brouillon";
  return {
    type, kind: v.kind as "facture" | "avoir", number: v.number, status: v.status, title: v.title, client_id: v.client_id, mission_id: v.mission_id,
    issue_date: v.issue_date, due_date: v.due_date, service_date: v.service_date, valid_until: null, introduction: null, terms: null,
    payment_terms: v.payment_terms, notes: v.notes, discount_rate: n(v.discount_rate),
    totals: {
      subtotal_ht: String(v.subtotal_ht), discount_amount: String(v.discount_amount), total_ht: String(v.total_ht), total_vat: String(v.total_vat),
      total_ttc: String(v.total_ttc), amount_paid: String(v.amount_paid), amount_credited: String(v.amount_credited),
    },
    vat_breakdown: (v.vat_breakdown ?? []) as FinanceDoc["vat_breakdown"],
    lines: [...(v.invoice_items ?? [])].sort((a, b) => a.position - b.position).map((l) => ({ ...l, quantity: n(l.quantity), unit_price: n(l.unit_price), discount_rate: n(l.discount_rate), vat_rate: n(l.vat_rate), total_ht: n(l.total_ht) })),
    // Facture émise : informations figées à l'émission (intégrité).
    seller: issued ? (v.seller_snapshot as Party) : org,
    client: issued ? (v.client_snapshot as Party) : (v.clients as unknown as Party),
    mentions: (issued ? v.legal_mentions : { vat: org.vat_regime === "franchise" ? "TVA non applicable, art. 293 B du CGI" : null }) as Record<string, string | null>,
    invoiceSettings: org.invoice_settings ?? {},
  };
}

function PartyBlock({ title, p }: { title: string; p: Party }) {
  return (
    <View style={{ width: "48%" }}>
      <Text style={[s.small, { color: COLORS.gold, fontFamily: "Helvetica-Bold", letterSpacing: 1 }]}>{t(title)}</Text>
      <Text style={s.bold}>{t(p.legal_name || p.name)}</Text>
      {p.legal_form ? <Text>{t(p.legal_form)}</Text> : null}
      <Text>{t(p.address_line)}</Text>
      <Text>{t([p.postal_code, p.city].filter(Boolean).join(" "))}</Text>
      {p.siret || p.siren ? <Text>{p.siret ? `SIRET ${t(p.siret)}` : `SIREN ${t(p.siren)}`}</Text> : null}
      {p.vat_number ? <Text>TVA : {t(p.vat_number)}</Text> : null}
      {p.rcs ? <Text>{t(p.rcs)}</Text> : null}
      {p.email ? <Text>{t(p.email)}</Text> : null}
    </View>
  );
}

const LABEL = { devis: "DEVIS", facture: "FACTURE", avoir: "AVOIR" } as const;

export function FinanceDocumentPdf({ data }: { data: FinanceDoc }) {
  const draft = data.type === "invoice" ? data.status === "brouillon" : data.status === "brouillon";
  const numberLabel = data.number || "BROUILLON";
  const settings = data.invoiceSettings;
  return (
    <Document title={t(`${LABEL[data.kind]} ${numberLabel}`)} creator="NOAMIS 360°">
      <StandardPage header={`${LABEL[data.kind]} ${numberLabel}`} footer={t(data.seller.legal_name || data.seller.name || "")} watermark={draft ? "BROUILLON" : undefined} confidential={false}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: COLORS.black }}>{LABEL[data.kind]}</Text>
            <Text style={s.bold}>N° {t(numberLabel)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text>Date d&apos;émission : {date(data.issue_date)}</Text>
            {data.kind === "devis" ? <Text>Valable jusqu&apos;au : {date(data.valid_until)}</Text> : <Text>Date de la prestation : {date(data.service_date)}</Text>}
            {data.kind === "facture" ? <Text style={s.bold}>Échéance : {date(data.due_date)}</Text> : null}
            {data.kind === "avoir" && data.mentions.credited_invoice ? <Text>Avoir sur facture n° {t(data.mentions.credited_invoice)}</Text> : null}
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <PartyBlock title="ÉMETTEUR" p={data.seller} />
          <PartyBlock title={data.kind === "devis" ? "DESTINATAIRE" : "CLIENT"} p={data.client} />
        </View>
        <Text style={[s.h3, { marginTop: 0 }]}>Objet : {t(data.title)}</Text>
        {data.introduction ? <Text style={s.p}>{t(data.introduction)}</Text> : null}
        <Table
          cols={[
            { label: "Désignation", width: "42%" },
            { label: "Qté", width: "9%", align: "right" },
            { label: "Unité", width: "10%" },
            { label: "PU HT", width: "13%", align: "right" },
            { label: "Rem.", width: "7%", align: "right" },
            { label: "TVA", width: "7%", align: "right" },
            { label: "Total HT", width: "12%", align: "right" },
          ]}
          rows={data.lines.map((l) => [
            t(l.description),
            String(l.quantity).replace(".", ","),
            t(l.unit),
            money(l.unit_price),
            l.discount_rate ? `${l.discount_rate} %` : "-",
            `${String(l.vat_rate).replace(".", ",")} %`,
            money(l.total_ht),
          ])}
        />
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 6 }}>
          <View style={{ width: "45%" }}>
            {[
              ["Total HT avant remise", money(data.totals.subtotal_ht)],
              ...(n(data.totals.discount_amount) ? [[`Remise (${data.discount_rate} %)`, `- ${money(data.totals.discount_amount)}`]] : []),
              ["Total HT", money(data.totals.total_ht)],
              ...data.vat_breakdown.map((v) => [`TVA ${String(v.rate).replace(".", ",")} % sur ${money(v.base)}`, money(v.vat)]),
              ["Total TTC", money(data.totals.total_ttc)],
              ...(data.kind === "facture" && n(data.totals.amount_paid) ? [["Déjà réglé", money(data.totals.amount_paid)]] : []),
            ].map(([label, value], i, arr) => (
              <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderTopWidth: i === arr.length - 1 ? 1 : 0, borderTopColor: COLORS.gold }}>
                <Text style={i === arr.length - 1 ? s.bold : undefined}>{label}</Text>
                <Text style={i === arr.length - 1 ? s.bold : undefined}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[s.box, { marginTop: 16 }]}>
          {data.mentions.vat ? <Text>{t(data.mentions.vat)}</Text> : null}
          {data.payment_terms ? <Text>Conditions de paiement : {t(data.payment_terms)}</Text> : null}
          {data.kind !== "devis" ? (
            <>
              <Text>{t(data.mentions.late_penalty ?? `Pénalités de retard : ${String(settings.late_penalty_rate ?? "3 fois le taux d'intérêt légal")}`)}</Text>
              {data.mentions.recovery_fee ? <Text>{t(data.mentions.recovery_fee)}</Text> : null}
              <Text>{t(data.mentions.early_payment ?? String(settings.early_payment_discount ?? "Pas d'escompte pour paiement anticipé"))}</Text>
              <Text>Catégorie de l&apos;opération : {t(data.mentions.operation_category ?? "Prestation de services")}</Text>
            </>
          ) : (
            <Text>Devis valable jusqu&apos;au {date(data.valid_until)}. Bon pour accord : date, signature et mention « lu et approuvé ».</Text>
          )}
          {data.seller.iban && data.kind !== "devis" ? <Text>Règlement par virement : IBAN {t(data.seller.iban)}{data.seller.bic ? ` - BIC ${t(data.seller.bic)}` : ""}</Text> : null}
        </View>
        {data.terms ? (
          <>
            <Text style={s.h3}>Conditions particulières</Text>
            <Text style={s.small}>{t(data.terms)}</Text>
          </>
        ) : null}
        {data.notes ? <Text style={[s.small, s.muted, { marginTop: 8 }]}>{t(data.notes)}</Text> : null}
        {draft ? <Text style={[s.small, { color: "#B42318", marginTop: 8 }]}>Document provisoire, sans valeur comptable.</Text> : null}
      </StandardPage>
    </Document>
  );
}
