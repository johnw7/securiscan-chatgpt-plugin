import type { Metadata } from "next";
import { NotificationsList } from "@/components/shared/notifications-list";
import { PageHeader } from "@/components/ui/misc";
import { markMyNotificationsRead } from "@/features/connect/actions";
import { requireClient } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function PortalNotifications() {
  const session = await requireClient();
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title="Notifications" />
      <NotificationsList userId={session.userId} markAll={markMyNotificationsRead} />
    </>
  );
}
