import { AppShell } from "@/components/layout/app-shell";
import { requireClient } from "@/lib/auth/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClient();
  return <AppShell session={session}>{children}</AppShell>;
}
