"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { check, guarded } from "@/lib/actions";
import { parisLocalToISO } from "@/lib/utils";
import { uuid } from "@/lib/validation/common";
import {
  closureSchema, criterionSchema, decisionSchema, meetingSchema, milestoneSchema, offerSchema, projectSchema, receptionSchema, scoresSchema,
  specificationSchema, vendorSchema,
} from "./schemas";

const path = (id: string) => `/project/${id}`;

export async function saveProject(input: unknown) {
  return guarded("project.manage", projectSchema, input, async ({ id, ...values }, { supabase }) => {
    const row = id
      ? check(await supabase.from("projects").update(values).eq("id", id).select("id").single())
      : check(await supabase.from("projects").insert(values).select("id").single());
    revalidatePath("/project");
    return { ok: true, data: { id: row.id } };
  });
}

export async function setProjectPhase(projectId: string, phase: string) {
  return guarded("project.manage", z.object({ id: uuid, phase: projectSchema.shape.phase }), { id: projectId, phase }, async (d, { supabase }) => {
    if (d.phase === "cloture") return { ok: false, error: "La clôture se fait via l'onglet « Réception & clôture »." };
    check(await supabase.from("projects").update({ phase: d.phase }).eq("id", d.id).neq("status", "clos").select("id").single());
    revalidatePath(path(d.id));
    return { ok: true };
  });
}

export async function saveSpecification(projectId: string, input: unknown) {
  return guarded("project.manage", specificationSchema, input, async (values, { supabase }) => {
    check(await supabase.from("projects").update(values).eq("id", projectId).select("id").single());
    revalidatePath(path(projectId));
    return { ok: true, message: "Cahier des charges enregistré" };
  });
}

export async function saveMilestone(projectId: string, input: unknown) {
  return guarded("project.manage", milestoneSchema, input, async ({ id, ...values }, { supabase }) => {
    const patch = { ...values, completed_at: values.status === "atteint" ? new Date().toISOString() : null };
    if (id) check(await supabase.from("milestones").update(patch).eq("id", id).eq("project_id", projectId).select("id").single());
    else check(await supabase.from("milestones").insert({ ...patch, project_id: projectId }).select("id").single());
    revalidatePath(path(projectId));
    return { ok: true };
  });
}

export async function deleteMilestone(projectId: string, id: string) {
  return guarded("project.manage", uuid, id, async (mid, { supabase }) => {
    const { error } = await supabase.from("milestones").delete().eq("id", mid).eq("project_id", projectId);
    if (error) throw error;
    revalidatePath(path(projectId));
    return { ok: true, message: "Jalon supprimé" };
  });
}

export async function saveVendor(input: unknown) {
  return guarded("project.manage", vendorSchema, input, async ({ id, ...values }, { supabase }) => {
    const row = id
      ? check(await supabase.from("vendors").update(values).eq("id", id).select("id").single())
      : check(await supabase.from("vendors").insert(values).select("id").single());
    revalidatePath("/project/vendors");
    return { ok: true, data: { id: row.id } };
  });
}

export async function saveCriterion(projectId: string, input: unknown) {
  return guarded("project.manage", criterionSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) check(await supabase.from("selection_criteria").update(values).eq("id", id).eq("project_id", projectId).select("id").single());
    else check(await supabase.from("selection_criteria").insert({ ...values, project_id: projectId }).select("id").single());
    revalidatePath(path(projectId));
    return { ok: true };
  });
}

export async function deleteCriterion(projectId: string, id: string) {
  return guarded("project.manage", uuid, id, async (cid, { supabase }) => {
    const { error } = await supabase.from("selection_criteria").delete().eq("id", cid).eq("project_id", projectId);
    if (error) throw error;
    revalidatePath(path(projectId));
    return { ok: true, message: "Critère supprimé" };
  });
}

export async function saveOffer(projectId: string, input: unknown) {
  return guarded("project.manage", offerSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) check(await supabase.from("vendor_offers").update(values).eq("id", id).eq("project_id", projectId).select("id").single());
    else check(await supabase.from("vendor_offers").insert({ ...values, project_id: projectId }).select("id").single());
    revalidatePath(path(projectId));
    return { ok: true };
  });
}

export async function saveOfferScores(projectId: string, input: unknown) {
  return guarded("project.manage", scoresSchema, input, async ({ offerId, scores }, { supabase }) => {
    check(await supabase.from("vendor_offers").update({ scores }).eq("id", offerId).eq("project_id", projectId).select("id").single());
    revalidatePath(path(projectId));
    return { ok: true, message: "Notes enregistrées" };
  });
}

/** Sélection de l'offre retenue (le client choisit et contracte directement avec le prestataire). */
export async function selectOffer(projectId: string, offerId: string) {
  return guarded("project.manage", z.object({ p: uuid, o: uuid }), { p: projectId, o: offerId }, async ({ p, o }, { supabase }) => {
    const { error } = await supabase.from("vendor_offers").update({ is_selected: false }).eq("project_id", p).eq("is_selected", true);
    if (error) throw error;
    const offer = check(await supabase.from("vendor_offers").update({ is_selected: true }).eq("id", o).eq("project_id", p).select("id, vendors(name)").single());
    check(
      await supabase
        .from("project_decisions")
        .insert({
          project_id: p, kind: "decision", status: "close", decided_at: new Date().toISOString().slice(0, 10),
          title: `Offre retenue : ${(offer.vendors as { name: string } | null)?.name ?? "prestataire"}`,
          description: "Choix enregistré dans NOAMIS 360° à l'issue de la comparaison des offres. Le contrat est conclu directement entre le client et le prestataire.",
        })
        .select("id")
        .single(),
    );
    revalidatePath(path(p));
    return { ok: true, message: "Offre retenue et décision consignée" };
  });
}

export async function saveMeeting(projectId: string, input: unknown) {
  return guarded("project.manage", meetingSchema, input, async ({ id, held_at, ...values }, { supabase }) => {
    const patch = { ...values, held_at: parisLocalToISO(held_at) };
    if (id) check(await supabase.from("project_meetings").update(patch).eq("id", id).eq("project_id", projectId).select("id").single());
    else check(await supabase.from("project_meetings").insert({ ...patch, project_id: projectId }).select("id").single());
    revalidatePath(path(projectId));
    return { ok: true };
  });
}

export async function saveDecision(projectId: string, input: unknown) {
  return guarded("project.manage", decisionSchema, input, async ({ id, ...values }, { supabase }) => {
    const patch = { ...values, resolved_at: ["levee", "close"].includes(values.status) ? new Date().toISOString() : null };
    if (id) check(await supabase.from("project_decisions").update(patch).eq("id", id).eq("project_id", projectId).select("id").single());
    else check(await supabase.from("project_decisions").insert({ ...patch, project_id: projectId }).select("id").single());
    revalidatePath(path(projectId));
    return { ok: true };
  });
}

export async function setDecisionStatus(projectId: string, id: string, status: string) {
  return guarded("project.manage", z.object({ id: uuid, status: decisionSchema.shape.status }), { id, status }, async (d, { supabase }) => {
    check(
      await supabase
        .from("project_decisions")
        .update({ status: d.status, resolved_at: ["levee", "close"].includes(d.status) ? new Date().toISOString() : null })
        .eq("id", d.id)
        .eq("project_id", projectId)
        .select("id")
        .single(),
    );
    revalidatePath(path(projectId));
    return { ok: true };
  });
}

export async function saveReception(projectId: string, input: unknown) {
  return guarded("project.manage", receptionSchema, input, async (values, { supabase }) => {
    check(await supabase.from("projects").update({ ...values, phase: "reception" }).eq("id", projectId).select("id").single());
    revalidatePath(path(projectId));
    return { ok: true, message: "Réception enregistrée" };
  });
}

export async function closeProject(projectId: string, input: unknown) {
  return guarded("project.manage", closureSchema, input, async ({ closure_notes }, { supabase }) => {
    const { error } = await supabase.rpc("close_project", { p_project: projectId, p_notes: closure_notes });
    if (error) throw error;
    revalidatePath(path(projectId));
    return { ok: true, message: "Projet clôturé" };
  });
}
