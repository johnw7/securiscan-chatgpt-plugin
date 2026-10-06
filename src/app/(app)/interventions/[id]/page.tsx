import type { Metadata } from "next";
import { interventionIds } from "@/lib/data/static-ids";
import { InterventionDetailView } from "@/components/interventions/InterventionDetailView";

export function generateStaticParams() {
  return interventionIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function InterventionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InterventionDetailView id={decodeURIComponent(id)} />;
}
