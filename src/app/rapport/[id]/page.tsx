import type { Metadata } from "next";
import { interventionIds } from "@/lib/data/static-ids";
import { ReportDocument } from "@/components/interventions/ReportDocument";

export function generateStaticParams() {
  return interventionIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Rapport ${id}` };
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportDocument id={decodeURIComponent(id)} />;
}
