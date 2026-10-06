import type { Metadata } from "next";
import { ClientDetailView } from "@/components/clients/ClientDetailView";
import { CLIENT_SEEDS } from "@/lib/data/clients";

export function generateStaticParams() {
  return CLIENT_SEEDS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: CLIENT_SEEDS.find((c) => c.id === id)?.name ?? "Fiche client" };
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDetailView id={id} />;
}
