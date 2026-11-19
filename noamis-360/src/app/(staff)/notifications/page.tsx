import type { Metadata } from "next";
import { NotificationsList } from "@/components/shared/notifications-list";
import { PageHeader } from "@/components/ui/misc";
import { markNotificationsRead } from "@/features/pilot/actions";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await requireStaff();
  return (
    <>
      <PageHeader title="Notifications" description="Assignations, messages clients, validations et nouveaux prospects." />
      <NotificationsList userId={session.userId} markAll={markNotificationsRead.bind(null, "all")} />
    </>
  );
}
