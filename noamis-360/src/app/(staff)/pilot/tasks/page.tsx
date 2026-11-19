import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/entity-form";
import { PageHeader } from "@/components/ui/misc";
import { saveTask } from "@/features/pilot/actions";
import { taskFields } from "@/features/pilot/fields";
import { getMissionOptions, getStaffOptions } from "@/features/pilot/queries";
import { TasksTable } from "@/features/pilot/tables";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Tâches et échéances" };

export default async function TasksPage() {
  const session = await requireCapability("mission.manage");
  const supabase = await createClient();
  const [{ data }, staff, missions] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, assignee_id, mission_id, missions(reference, title), profiles!tasks_assignee_id_fkey(full_name)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(1000),
    getStaffOptions(),
    getMissionOptions(),
  ]);
  const today = todayISO();
  const rows = (data ?? []).map((t) => ({
    id: t.id, title: t.title, status: t.status, priority: t.priority, due_date: t.due_date, assignee_id: t.assignee_id, mission_id: t.mission_id,
    mission: (t.missions as { reference: string } | null)?.reference ?? null,
    assignee: (t.profiles as { full_name: string | null } | null)?.full_name ?? null,
    overdue: !!t.due_date && t.due_date < today && ["a_faire", "en_cours"].includes(t.status),
  }));
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PILOT"
        title="Tâches et échéances"
        description={`${rows.filter((r) => r.overdue).length} tâche(s) en retard · ${rows.filter((r) => ["a_faire", "en_cours"].includes(r.status)).length} ouverte(s)`}
        actions={
          <FormDialog
            title="Nouvelle tâche"
            trigger={<Button><Plus /> Nouvelle tâche</Button>}
            schema="task"
            fields={taskFields(staff, missions)}
            defaultValues={{ priority: "normale", status: "a_faire", assignee_id: session.userId }}
            action={saveTask}
            successMessage="Tâche créée"
          />
        }
      />
      <TasksTable rows={rows} me={session.userId} />
    </>
  );
}
