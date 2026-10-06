import type { Metadata } from "next";
import { TechnicianShell } from "@/components/technician/TechnicianShell";

export const metadata: Metadata = { title: "Vue technicien" };

export default function TechnicianPage() {
  return <TechnicianShell />;
}
