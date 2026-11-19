import { AppShell } from "@/components/layout/app-shell";
import { requireStaff } from "@/lib/auth/session";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  return <AppShell session={session}>{children}</AppShell>;
}
