import type { Metadata } from "next";
import { TeamView } from "@/components/team/TeamView";

export const metadata: Metadata = { title: "Équipe" };

export default function TeamPage() {
  return <TeamView />;
}
