import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";

export default async function SharedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  return <AppShell session={session}>{children}</AppShell>;
}
