import { NextResponse, type NextRequest } from "next/server";
import { buildSalesJournal } from "@/features/finance/accounting";
import { exportSchema } from "@/features/finance/schemas";
import { authorize } from "@/lib/auth/session";
import { contentDisposition } from "@/lib/files";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Export du journal des ventes (factures et avoirs émis) sur une période. */
export async function GET(request: NextRequest) {
  if (!(await authorize("finance.export"))) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const parsed = exportSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success || parsed.data.from > parsed.data.to) return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("number, kind, issue_date, total_ht, total_vat, total_ttc, client_id, client_snapshot")
    .neq("status", "brouillon")
    .gte("issue_date", parsed.data.from)
    .lte("issue_date", parsed.data.to);
  if (error) return NextResponse.json({ error: "Export impossible" }, { status: 500 });
  const journal = buildSalesJournal(
    (data ?? []).map((i) => ({
      number: i.number!, kind: i.kind as "facture" | "avoir", issue_date: i.issue_date!, total_ht: i.total_ht, total_vat: i.total_vat, total_ttc: i.total_ttc,
      client_name: String((i.client_snapshot as { name?: string } | null)?.name ?? ""), client_code: `C${i.client_id.slice(0, 8).toUpperCase()}`,
    })),
  );
  return new Response(`﻿${journal}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": contentDisposition(`Journal-ventes-${parsed.data.from}-${parsed.data.to}.csv`),
      "Cache-Control": "private, no-store",
    },
  });
}
