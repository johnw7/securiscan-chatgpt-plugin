import type { Metadata } from "next";
import { ReportDocument } from "@/components/interventions/ReportDocument";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Rapport ${id}` };
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportDocument id={decodeURIComponent(id)} />;
}
