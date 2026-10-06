import type { Metadata } from "next";
import { QuotesView } from "@/components/quotes/QuotesView";

export const metadata: Metadata = { title: "Devis" };

export default function QuotesPage() {
  return <QuotesView />;
}
