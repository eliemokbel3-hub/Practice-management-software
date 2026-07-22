import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type {
  ClinicalNote,
  NoteContent,
  NoteTemplate,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToNote(row: any): ClinicalNote {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    practitionerId: row.practitioner_id,
    appointmentId: row.appointment_id,
    templateId: row.template_id,
    content: row.content ?? { sections: [], answers: {} },
    status: row.status,
    finalisedAt: row.finalised_at,
    archivedAt: row.archived_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patientName: row.patients
      ? `${row.patients.first_name} ${row.patients.last_name}`
      : undefined,
    practitionerName: row.profiles
      ? `${row.profiles.first_name} ${row.profiles.last_name}`
      : undefined,
    revisionCount: Array.isArray(row.clinical_note_revisions)
      ? (row.clinical_note_revisions[0]?.count ?? 0)
      : undefined,
  };
}

const SELECT_WITH_JOINS =
  "*, patients(first_name, last_name), profiles(first_name, last_name), clinical_note_revisions(count)";

/** Build a fresh content snapshot from a template, applying prefills. */
export function contentFromTemplate(template: NoteTemplate): NoteContent {
  const answers: Record<string, string | boolean> = {};
  for (const section of template.sections) {
    for (const q of section.questions) {
      const key = `${section.key}.${q.key}`;
      if (q.type === "checkbox") answers[key] = false;
      else answers[key] = q.prefill ?? "";
    }
  }
  return { sections: template.sections, answers };
}

export async function createNote(input: {
  patientId: string;
  appointmentId: string | null;
  template: NoteTemplate;
}): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .insert({
      clinic_id: profile.clinic_id,
      patient_id: input.patientId,
      practitioner_id: profile.id,
      appointment_id: input.appointmentId,
      template_id: input.template.id,
      content: contentFromTemplate(input.template),
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't create note: ${error.message}`);
  return data.id;
}

export async function getNote(id: string): Promise<ClinicalNote | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select(SELECT_WITH_JOINS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load note: ${error.message}`);
  return data ? rowToNote(data) : null;
}

export async function listNotesForPatient(
  patientId: string
): Promise<ClinicalNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select(SELECT_WITH_JOINS)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load notes: ${error.message}`);
  return (data ?? []).map(rowToNote);
}

/** Unfinalised notes across the clinic, newest first — for the dashboard. */
export async function listDraftNotes(limit = 12): Promise<ClinicalNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select(SELECT_WITH_JOINS)
    .eq("status", "draft")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Couldn't load draft notes: ${error.message}`);
  return (data ?? []).map(rowToNote);
}

/** Archive or restore a treatment note (records are never deleted). */
export async function setNoteArchived(
  id: string,
  archived: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clinical_notes")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update note: ${error.message}`);
}

export async function getNoteForAppointment(
  appointmentId: string
): Promise<ClinicalNote | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select("id, status")
    .eq("appointment_id", appointmentId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load note: ${error.message}`);
  return data ? ({ id: data.id, status: data.status } as ClinicalNote) : null;
}

/** Autosave for drafts only — finalised notes must go through amendNote. */
export async function saveDraftAnswers(
  id: string,
  answers: Record<string, string | boolean>
): Promise<void> {
  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("clinical_notes")
    .select("content, status")
    .eq("id", id)
    .single();
  if (loadError) throw new Error(`Couldn't save note: ${loadError.message}`);
  if (existing.status !== "draft") {
    throw new Error("This note is finalised — use Amend instead.");
  }
  const { error } = await supabase
    .from("clinical_notes")
    .update({ content: { ...existing.content, answers } })
    .eq("id", id);
  if (error) throw new Error(`Couldn't save note: ${error.message}`);
}

export async function finaliseNote(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clinical_notes")
    .update({ status: "final", finalised_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw new Error(`Couldn't finalise note: ${error.message}`);
}

/**
 * Amend a finalised note: keep a full copy of the current content in the
 * revision history, then write the new answers. The note stays finalised.
 */
export async function amendNote(
  id: string,
  answers: Record<string, string | boolean>
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("clinical_notes")
    .select("content, status, clinic_id")
    .eq("id", id)
    .single();
  if (loadError) throw new Error(`Couldn't amend note: ${loadError.message}`);
  if (existing.status !== "final") {
    throw new Error("Only finalised notes can be amended.");
  }
  const { error: revError } = await supabase
    .from("clinical_note_revisions")
    .insert({
      clinic_id: existing.clinic_id,
      note_id: id,
      content: existing.content,
      edited_by: profile.id,
    });
  if (revError) throw new Error(`Couldn't amend note: ${revError.message}`);
  const { error } = await supabase
    .from("clinical_notes")
    .update({ content: { ...existing.content, answers } })
    .eq("id", id);
  if (error) throw new Error(`Couldn't amend note: ${error.message}`);
}
