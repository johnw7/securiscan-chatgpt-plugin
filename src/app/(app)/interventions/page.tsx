import type { Metadata } from "next";
import { Suspense } from "react";
import { InterventionsView } from "@/components/interventions/InterventionsView";

export const metadata: Metadata = { title: "Interventions" };

export default function InterventionsPage() {
  return (
    <Suspense>
      <InterventionsView />
    </Suspense>
  );
}
