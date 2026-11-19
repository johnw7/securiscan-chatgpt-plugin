import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/misc";
import { markMyThreadRead, sendClientMessage } from "@/features/connect/actions";
import { MessageThread } from "@/features/connect/thread";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messagerie" };

async function send(body: string) {
  "use server";
  return sendClientMessage({ body });
}

export default async function PortalMessages() {
  await requireClient();
  const supabase = await createClient();
  const { data } = await supabase.from("messages").select("id, body, from_client, created_at, profiles(full_name)").order("created_at").limit(500);
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title="Messagerie" description="Échangez en toute confidentialité avec votre consultant NOAMIS. En cas d'urgence, composez le 17 ou le 112." />
      <MessageThread
        viewer="client"
        messages={(data ?? []).map((m) => ({ id: m.id, body: m.body, from_client: m.from_client, created_at: m.created_at, author: m.from_client ? "Vous" : `${(m.profiles as { full_name: string | null } | null)?.full_name ?? "NOAMIS"} (NOAMIS)` }))}
        send={send}
        onOpen={markMyThreadRead}
      />
    </>
  );
}
