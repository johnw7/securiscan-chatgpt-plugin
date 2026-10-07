import type { Metadata } from "next";
import { PreventionPlayer } from "@/components/prevention/PreventionPlayer";

export const metadata: Metadata = { title: "Prévention — Sur le chemin de l'école" };

export default function PreventionPage() {
  return <PreventionPlayer />;
}
