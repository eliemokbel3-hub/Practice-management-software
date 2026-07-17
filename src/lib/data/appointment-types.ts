import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { AppointmentType, AppointmentTypeInput } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToType(row: any): AppointmentType {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    description: row.description,
    category: row.category,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    color: row.color,
    bufferBeforeMinutes: row.buffer_before_minutes,
    bufferAfterMinutes: row.buffer_after_minutes,
    bookableOnline: row.bookable_online,
    isActive: row.is_active,
    maxPatients: row.max_patients,
    sortOrder: row.sort_order,
    defaultNoteTemplateId: row.default_note_template_id,
  };
}

function inputToRow(input: AppointmentTypeInput) {
  return {
    name: input.name,
    description: input.description,
    category: input.category,
    duration_minutes: input.durationMinutes,
    price_cents: input.priceCents,
    color: input.color,
    buffer_before_minutes: input.bufferBeforeMinutes,
    buffer_after_minutes: input.bufferAfterMinutes,
    bookable_online: input.bookableOnline,
    is_active: input.isActive,
    max_patients: input.maxPatients,
    sort_order: input.sortOrder,
  };
}

export async function listAppointmentTypes(opts?: {
  includeInactive?: boolean;
}): Promise<AppointmentType[]> {
  const supabase = await createClient();
  let q = supabase.from("appointment_types").select("*").order("sort_order");
  if (!opts?.includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(`Couldn't load appointment types: ${error.message}`);
  return (data ?? []).map(rowToType);
}

export async function getAppointmentType(
  id: string
): Promise<AppointmentType | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load appointment type: ${error.message}`);
  return data ? rowToType(data) : null;
}

export async function createAppointmentType(
  input: AppointmentTypeInput
): Promise<AppointmentType> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_types")
    .insert({ ...inputToRow(input), clinic_id: profile.clinic_id })
    .select()
    .single();
  if (error) throw new Error(`Couldn't create appointment type: ${error.message}`);
  // Single-practitioner clinics: offer every type from every practitioner for now.
  await supabase.from("practitioner_appointment_types").insert({
    practitioner_id: profile.id,
    appointment_type_id: data.id,
    clinic_id: profile.clinic_id,
  });
  return rowToType(data);
}

export async function updateAppointmentType(
  id: string,
  input: AppointmentTypeInput
): Promise<void> {
  const supabase = await createClient();
  // is_active is managed by setAppointmentTypeActive — editing must not
  // silently re-activate an archived type.
  const { is_active: _ignored, ...row } = inputToRow(input);
  void _ignored;
  const { error } = await supabase
    .from("appointment_types")
    .update(row)
    .eq("id", id);
  if (error) throw new Error(`Couldn't update appointment type: ${error.message}`);
}

export async function setAppointmentTypeActive(
  id: string,
  active: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointment_types")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update appointment type: ${error.message}`);
}
