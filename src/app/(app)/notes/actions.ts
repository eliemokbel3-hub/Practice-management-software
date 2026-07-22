"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  amendNote,
  createNote,
  finaliseNote,
  getNote,
  getNoteForAppointment,
  saveDraftAnswers,
  setNoteArchived,
} from "@/lib/data/clinical-notes";
import {
  getDefaultNoteTemplate,
  getNoteTemplate,
} from "@/lib/data/note-templates";
import { getAppointment } from "@/lib/data/appointments";
import { getAppointmentType } from "@/lib/data/appointment-types";

/** Open (or create) the treatment note for an appointment. */
export async function openNoteForAppointmentAction(appointmentId: string) {
  const existing = await getNoteForAppointment(appointmentId);
  if (existing) redirect(`/notes/${existing.id}`);

  const appointment = await getAppointment(appointmentId);
  if (!appointment) throw new Error("Appointment not found.");

  const type = appointment.appointmentTypeId
    ? await getAppointmentType(appointment.appointmentTypeId)
    : null;
  // Appointment type's default template, falling back to the clinic default.
  const template =
    (type?.defaultNoteTemplateId
      ? await getNoteTemplate(type.defaultNoteTemplateId)
      : null) ?? (await getDefaultNoteTemplate());
  if (!template) throw new Error("No note templates set up yet.");

  const id = await createNote({
    patientId: appointment.patientId,
    appointmentId,
    template,
  });
  revalidatePath(`/calendar/appointments/${appointmentId}`);
  redirect(`/notes/${id}`);
}

export async function createNoteForPatientAction(
  patientId: string,
  form: FormData
) {
  const templateId = String(form.get("templateId") ?? "");
  const template = templateId
    ? await getNoteTemplate(templateId)
    : await getDefaultNoteTemplate();
  if (!template) throw new Error("Please choose a note template.");
  const id = await createNote({ patientId, appointmentId: null, template });
  revalidatePath(`/patients/${patientId}`);
  redirect(`/notes/${id}`);
}

export async function saveDraftAction(
  id: string,
  answers: Record<string, string | boolean>
): Promise<{ savedAt: string }> {
  await saveDraftAnswers(id, answers);
  return { savedAt: new Date().toISOString() };
}

export async function finaliseNoteAction(
  id: string,
  answers: Record<string, string | boolean>
) {
  await saveDraftAnswers(id, answers);
  await finaliseNote(id);
  revalidatePath(`/notes/${id}`);
  redirect(`/notes/${id}`);
}

export async function amendNoteAction(
  id: string,
  answers: Record<string, string | boolean>
) {
  await amendNote(id, answers);
  revalidatePath(`/notes/${id}`);
  redirect(`/notes/${id}`);
}

export async function setNoteArchivedAction(id: string, archived: boolean) {
  const note = await getNote(id);
  await setNoteArchived(id, archived);
  revalidatePath(`/notes/${id}`);
  if (note?.patientId) revalidatePath(`/patients/${note.patientId}`);
  revalidatePath("/");
  // Send the practitioner back to the patient file when archiving.
  redirect(archived && note?.patientId ? `/patients/${note.patientId}` : `/notes/${id}`);
}
