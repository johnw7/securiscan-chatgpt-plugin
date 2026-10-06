import type { Metadata } from "next";
import { InterventionDetailView } from "@/components/interventions/InterventionDetailView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function InterventionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InterventionDetailView id={decodeURIComponent(id)} />;
}
