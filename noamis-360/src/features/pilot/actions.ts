"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { check, guarded } from "@/lib/actions";
import { uuid } from "@/lib/validation/common";
import { parisLocalToISO } from "@/lib/utils";
import {
  clientSchema, contactSchema, eventSchema, LEAD_STAGE_VALUES, leadSchema, MISSION_STATUS_VALUES, missionSchema, noteSchema,
  TASK_STATUS_VALUES, taskSchema,
} from "./schemas";

// ---------------------------------------------------------------- Clients
export async function saveClient(input: unknown) {
  return guarded("crm.manage", clientSchema, input, async ({ id, ...values }, { supabase }) => {
    const row = id
      ? check(await supabase.from("clients").update(values).eq("id", id).select("id").single())
      : check(await supabase.from("clients").insert(values).select("id").single());
    revalidatePath("/pilot/clients");
    return { ok: true, data: { id: row.id } };
  });
}

export async function archiveClient(id: string) {
  return guarded("mission.delete", uuid, id, async (clientId, { supabase }) => {
    check(await supabase.from("clients").update({ deleted_at: new Date().toISOString(), status: "inactif" }).eq("id", clientId).select("id").single());
    revalidatePath("/pilot/clients");
    return { ok: true, message: "Client archivé" };
  });
}

// ---------------------------------------------------------------- Contacts
export async function saveContact(input: unknown) {
  return guarded("crm.manage", contactSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) check(await supabase.from("contacts").update(values).eq("id", id).select("id").single());
    else check(await supabase.from("contacts").insert(values).select("id").single());
    revalidatePath(`/pilot/clients/${values.client_id}`);
    return { ok: true };
  });
}

export async function deleteContact(id: string) {
  return guarded("crm.manage", uuid, id, async (contactId, { supabase }) => {
    check(await supabase.from("contacts").update({ deleted_at: new Date().toISOString() }).eq("id", contactId).select("id").single());
    return { ok: true, message: "Contact supprimé" };
  });
}

// ---------------------------------------------------------------- Prospects
export async function saveLead(input: unknown) {
  return guarded("crm.manage", leadSchema, input, async ({ id, ...values }, { supabase }) => {
    const row = id
      ? check(await supabase.from("leads").update(values).eq("id", id).select("id").single())
      : check(await supabase.from("leads").insert(values).select("id").single());
    revalidatePath("/pilot/leads");
    return { ok: true, data: { id: row.id } };
  });
}

export async function setLeadStage(id: string, stage: string) {
  return guarded("crm.manage", z.object({ id: uuid, stage: z.enum(LEAD_STAGE_VALUES) }), { id, stage }, async (d, { supabase }) => {
    check(await supabase.from("leads").update({ stage: d.stage }).eq("id", d.id).select("id").single());
    revalidatePath("/pilot/leads");
    return { ok: true };
  });
}

/** Transforme un prospect gagné en fiche client (et la relie au prospect). */
export async function convertLead(id: string) {
  return guarded("crm.manage", uuid, id, async (leadId, { supabase }) => {
    const lead = check(await supabase.from("leads").select("*").eq("id", leadId).single());
    if (lead.client_id) return { ok: true, data: { id: lead.client_id }, message: "Client déjà existant" };
    const client = check(
      await supabase
        .from("clients")
        .insert({
          name: lead.company || lead.contact_name || lead.title,
          category: lead.category ?? "entreprise",
          status: "actif",
          email: lead.email,
          phone: lead.phone,
          owner_id: lead.owner_id,
        })
        .select("id")
        .single(),
    );
    if (lead.contact_name) {
      const [first, ...rest] = lead.contact_name.split(" ");
      await supabase.from("contacts").insert({
        client_id: client.id, first_name: first ?? lead.contact_name, last_name: rest.join(" ") || "—", email: lead.email, phone: lead.phone, is_primary: true,
      });
    }
    check(await supabase.from("leads").update({ client_id: client.id, stage: "gagne" }).eq("id", leadId).select("id").single());
    revalidatePath("/pilot/leads");
    return { ok: true, data: { id: client.id }, message: "Client créé à partir du prospect" };
  });
}

export async function archiveLead(id: string) {
  return guarded("crm.manage", uuid, id, async (leadId, { supabase }) => {
    check(await supabase.from("leads").update({ deleted_at: new Date().toISOString() }).eq("id", leadId).select("id").single());
    revalidatePath("/pilot/leads");
    return { ok: true, message: "Prospect archivé" };
  });
}

// ---------------------------------------------------------------- Missions
export async function saveMission(input: unknown) {
  return guarded("mission.manage", missionSchema, input, async ({ id, ...values }, { supabase }) => {
    const row = id
      ? check(await supabase.from("missions").update(values).eq("id", id).select("id").single())
      : check(await supabase.from("missions").insert(values).select("id").single());
    revalidatePath("/pilot/missions");
    return { ok: true, data: { id: row.id } };
  });
}

export async function setMissionStatus(id: string, status: string) {
  return guarded("mission.manage", z.object({ id: uuid, status: z.enum(MISSION_STATUS_VALUES) }), { id, status }, async (d, { supabase }) => {
    const patch: { status: string; progress?: number } = { status: d.status };
    if (d.status === "terminee") patch.progress = 100;
    check(await supabase.from("missions").update(patch).eq("id", d.id).select("id").single());
    return { ok: true };
  });
}

export async function setMissionProgress(id: string, progress: string) {
  return guarded("mission.manage", z.object({ id: uuid, progress: z.coerce.number().int().min(0).max(100) }), { id, progress }, async (d, { supabase }) => {
    check(await supabase.from("missions").update({ progress: d.progress }).eq("id", d.id).select("id").single());
    return { ok: true };
  });
}

export async function archiveMission(id: string) {
  return guarded("mission.delete", uuid, id, async (missionId, { supabase }) => {
    check(await supabase.from("missions").update({ deleted_at: new Date().toISOString(), status: "annulee" }).eq("id", missionId).select("id").single());
    revalidatePath("/pilot/missions");
    return { ok: true, message: "Mission archivée" };
  });
}

export async function addMissionMember(missionId: string, input: unknown) {
  return guarded("mission.manage", z.object({ user_id: uuid }), input, async ({ user_id }, { supabase, session }) => {
    check(
      await supabase
        .from("mission_members")
        .insert({ mission_id: missionId, user_id, organization_id: session.organizationId })
        .select("mission_id")
        .single(),
    );
    return { ok: true, message: "Membre ajouté" };
  });
}

export async function removeMissionMember(missionId: string, userId: string) {
  return guarded("mission.manage", z.object({ m: uuid, u: uuid }), { m: missionId, u: userId }, async ({ m, u }, { supabase }) => {
    const { count, error } = await supabase.from("mission_members").delete({ count: "exact" }).eq("mission_id", m).eq("user_id", u);
    if (error) throw error;
    if (!count) return { ok: false, error: "Seuls le responsable de mission et les administrateurs gèrent l'équipe." };
    return { ok: true, message: "Membre retiré" };
  });
}

// ---------------------------------------------------------------- Tâches
export async function saveTask(input: unknown) {
  return guarded("mission.manage", taskSchema, input, async ({ id, ...values }, { supabase }) => {
    const patch = { ...values, completed_at: values.status === "terminee" ? new Date().toISOString() : null };
    if (id) check(await supabase.from("tasks").update(patch).eq("id", id).select("id").single());
    else check(await supabase.from("tasks").insert(patch).select("id").single());
    revalidatePath("/pilot/tasks");
    return { ok: true };
  });
}

export async function setTaskStatus(id: string, status: string) {
  return guarded("mission.manage", z.object({ id: uuid, status: z.enum(TASK_STATUS_VALUES) }), { id, status }, async (d, { supabase }) => {
    check(
      await supabase
        .from("tasks")
        .update({ status: d.status, completed_at: d.status === "terminee" ? new Date().toISOString() : null })
        .eq("id", d.id)
        .select("id")
        .single(),
    );
    return { ok: true };
  });
}

// ---------------------------------------------------------------- Notes internes
export async function addNote(input: unknown) {
  return guarded("crm.manage", noteSchema, input, async (values, { supabase }) => {
    check(await supabase.from("notes").insert(values).select("id").single());
    return { ok: true, message: "Note ajoutée" };
  });
}

export async function deleteNote(id: string) {
  return guarded("crm.manage", uuid, id, async (noteId, { supabase, session }) => {
    const { count, error } = await supabase.from("notes").delete({ count: "exact" }).eq("id", noteId).eq("author_id", session.userId);
    if (error) throw error;
    if (!count) return { ok: false, error: "Suppression réservée aux administrateurs (historique conservé)." };
    return { ok: true, message: "Note supprimée" };
  });
}

// ---------------------------------------------------------------- Calendrier
export async function saveEvent(input: unknown) {
  return guarded("mission.manage", eventSchema, input, async ({ id, starts_at, ends_at, ...values }, { supabase }) => {
    const patch = { ...values, starts_at: parisLocalToISO(starts_at), ends_at: parisLocalToISO(ends_at) };
    if (id) check(await supabase.from("calendar_events").update(patch).eq("id", id).select("id").single());
    else check(await supabase.from("calendar_events").insert(patch).select("id").single());
    revalidatePath("/pilot/calendar");
    return { ok: true };
  });
}

export async function deleteEvent(id: string) {
  return guarded("mission.manage", uuid, id, async (eventId, { supabase }) => {
    const { count, error } = await supabase.from("calendar_events").delete({ count: "exact" }).eq("id", eventId);
    if (error) throw error;
    if (!count) return { ok: false, error: "Suppression réservée aux administrateurs." };
    return { ok: true, message: "Événement supprimé" };
  });
}

// ---------------------------------------------------------------- Notifications
export async function markNotificationsRead(ids: unknown) {
  return guarded("workspace.access", z.array(uuid).max(500).or(z.literal("all")), ids, async (list, { supabase, session }) => {
    let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", session.userId).is("read_at", null);
    if (list !== "all") q = q.in("id", list);
    const { error } = await q;
    if (error) throw error;
    return { ok: true, message: "Notifications marquées comme lues" };
  });
}
