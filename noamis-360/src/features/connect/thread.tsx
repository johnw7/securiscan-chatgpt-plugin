"use client";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import type { ActionResult } from "@/lib/errors";
import { cn, formatDateTime } from "@/lib/utils";

export type ThreadMessage = { id: string; body: string; from_client: boolean; created_at: string; author: string };

/** Fil de discussion sécurisé entre le client et NOAMIS. */
export function MessageThread({
  messages,
  send,
  viewer,
  onOpen,
}: {
  messages: ThreadMessage[];
  send: (body: string) => Promise<ActionResult>;
  viewer: "client" | "staff";
  onOpen?: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();
  const end = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
    void onOpen?.();
  }, [messages.length, onOpen]);
  return (
    <div className="flex h-[60vh] min-h-96 flex-col rounded-xl border border-border bg-surface">
      <ol className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin" aria-label="Messages" aria-live="polite">
        {messages.map((m) => {
          const mine = viewer === "client" ? m.from_client : !m.from_client;
          return (
            <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", mine ? "rounded-br-sm bg-gold/15 text-foreground" : "rounded-bl-sm bg-surface-2")}>
                <p className="mb-1 text-xs text-muted">{m.author} · {formatDateTime(m.created_at)}</p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </li>
          );
        })}
        {!messages.length && <li className="py-10 text-center text-sm text-muted">Aucun message pour le moment.</li>}
        <div ref={end} />
      </ol>
      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          start(async () => {
            const r = await send(body);
            if (r.ok) {
              setBody("");
              router.refresh();
            } else toast.error(r.error);
          });
        }}
      >
        <label htmlFor="msg-body" className="sr-only">Votre message</label>
        <Textarea id="msg-body" rows={2} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écrire un message…" className="flex-1" />
        <Button type="submit" loading={pending} disabled={!body.trim()} aria-label="Envoyer"><Send /></Button>
      </form>
    </div>
  );
}
