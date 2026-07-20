import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { Appointment, AppointmentStatus } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    practitionerId: row.practitioner_id,
    appointmentTypeId: row.appointment_type_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    adminNotes: row.admin_notes,
    recurrenceGroup: row.recurrence_group,
    bookedOnline: row.booked_online ?? false,
    patientName: row.patients
      ? `${row.patients.first_name} ${row.patients.last_name}`
      : undefined,
    typeName: row.appointment_types?.name ?? undefined,
    typeColor: row.appointment_types?.color ?? undefined,
  };
}

const SELECT_WITH_JOINS =
  "*, patients(first_name, last_name), appointment_types(name, color)";

export async function listAppointmentsInRange(
  startIso: string,
  endIso: string
): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT_WITH_JOINS)
    .gte("starts_at", startIso)
    .lt("starts_at", endIso)
    .order("starts_at");
  if (error) throw new Error(`Couldn't load appointments: ${error.message}`);
  return (data ?? []).map(rowToAppointment);
}

export async function listUpcomingForPatient(
  patientId: string
): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT_WITH_JOINS)
    .eq("patient_id", patientId)
    .gte("starts_at", new Date().toISOString())
    .neq("status", "cancelled")
    .order("starts_at")
    .limit(5);
  if (error) throw new Error(`Couldn't load appointments: ${error.message}`);
  return (data ?? []).map(rowToAppointment);
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT_WITH_JOINS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load appointment: ${error.message}`);
  return data ? rowToAppointment(data) : null;
}

export interface CreateAppointmentInput {
  patientId: string;
  appointmentTypeId: string;
  startsAt: Date;
  durationMinutes: number;
  adminNotes: string | null;
  repeat: "none" | "weekly" | "fortnightly";
  repeatCount: number; // total occurrences including the first
}

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();

  const occurrences =
    input.repeat === "none" ? 1 : Math.min(Math.max(input.repeatCount, 1), 52);
  const stepDays = input.repeat === "fortnightly" ? 14 : 7;
  const recurrenceGroup = occurrences > 1 ? crypto.randomUUID() : null;

  const rows = Array.from({ length: occurrences }, (_, i) => {
    const starts = new Date(input.startsAt);
    starts.setDate(starts.getDate() + i * stepDays);
    const ends = new Date(starts.getTime() + input.durationMinutes * 60_000);
    return {
      clinic_id: profile.clinic_id,
      patient_id: input.patientId,
      practitioner_id: profile.id,
      appointment_type_id: input.appointmentTypeId,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      admin_notes: input.adminNotes,
      recurrence_group: recurrenceGroup,
    };
  });

  const { data, error } = await supabase
    .from("appointments")
    .insert(rows)
    .select("id, starts_at")
    .order("starts_at")
    .limit(1);
  if (error) throw new Error(`Couldn't book appointment: ${error.message}`);
  return data![0].id;
}

/**
 * Switch an appointment to a different type. The length becomes the new
 * type's default, keeping the same start time.
 */
export async function changeAppointmentType(
  id: string,
  appointmentTypeId: string,
  durationMinutes: number
): Promise<void> {
  const appointment = await getAppointment(id);
  if (!appointment) throw new Error("Appointment not found.");
  const supabase = await createClient();
  const starts = new Date(appointment.startsAt);
  const ends = new Date(starts.getTime() + durationMinutes * 60_000);
  const { error } = await supabase
    .from("appointments")
    .update({
      appointment_type_id: appointmentTypeId,
      ends_at: ends.toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`Couldn't change the appointment type: ${error.message}`);
}

export async function rescheduleAppointment(
  id: string,
  startsAt: Date,
  durationMinutes: number
): Promise<void> {
  const supabase = await createClient();
  const ends = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const { error } = await supabase
    .from("appointments")
    .update({
      starts_at: startsAt.toISOString(),
      ends_at: ends.toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`Couldn't reschedule: ${error.message}`);
}

export async function setAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancellationReason?: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      cancellation_reason:
        status === "cancelled" ? (cancellationReason ?? null) : null,
    })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update appointment: ${error.message}`);
}
