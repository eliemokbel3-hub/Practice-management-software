// Patient data access, backed by Supabase. Row-level security means queries
// only ever see the signed-in user's own clinic; inserts still need clinic_id
// set explicitly, taken from the user's profile.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { Patient, PatientInput, Sex } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToPatient(row: any): Patient {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    dateOfBirth: row.date_of_birth,
    sex: row.sex as Sex | null,
    email: row.email,
    phone: row.phone,
    addressLine1: row.address_line1,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    occupation: row.occupation,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelationship: row.emergency_contact_relationship,
    medicalHistory: row.medical_history,
    alerts: row.alerts,
    referralSource: row.referral_source,
    concession: row.concession ?? null,
    healthFundName: row.health_fund_name,
    healthFundMemberNumber: row.health_fund_member_number,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function inputToRow(input: PatientInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    preferred_name: input.preferredName,
    date_of_birth: input.dateOfBirth,
    sex: input.sex,
    email: input.email,
    phone: input.phone,
    address_line1: input.addressLine1,
    suburb: input.suburb,
    state: input.state,
    postcode: input.postcode,
    occupation: input.occupation,
    emergency_contact_name: input.emergencyContactName,
    emergency_contact_phone: input.emergencyContactPhone,
    emergency_contact_relationship: input.emergencyContactRelationship,
    medical_history: input.medicalHistory,
    alerts: input.alerts,
    referral_source: input.referralSource,
    concession: input.concession,
    health_fund_name: input.healthFundName,
    health_fund_member_number: input.healthFundMemberNumber,
  };
}

export async function listPatients(opts?: {
  query?: string;
  includeArchived?: boolean;
}): Promise<Patient[]> {
  const supabase = await createClient();
  let q = supabase
    .from("patients")
    .select("*")
    .order("last_name")
    .order("first_name");
  if (!opts?.includeArchived) q = q.is("archived_at", null);

  const term = opts?.query?.trim();
  if (term) {
    // Match each word against name/contact fields.
    for (const word of term.split(/\s+/)) {
      const w = word.replace(/[%,()]/g, "");
      if (!w) continue;
      q = q.or(
        [
          `first_name.ilike.%${w}%`,
          `last_name.ilike.%${w}%`,
          `preferred_name.ilike.%${w}%`,
          `email.ilike.%${w}%`,
          `phone.ilike.%${w}%`,
          `suburb.ilike.%${w}%`,
        ].join(",")
      );
    }
  }

  const { data, error } = await q;
  if (error) throw new Error(`Couldn't load patients: ${error.message}`);
  return (data ?? []).map(rowToPatient);
}

export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load patient: ${error.message}`);
  return data ? rowToPatient(data) : null;
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Your login isn't linked to a clinic yet.");
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({ ...inputToRow(input), clinic_id: profile.clinic_id })
    .select()
    .single();
  if (error) throw new Error(`Couldn't create patient: ${error.message}`);
  return rowToPatient(data);
}

export async function updatePatient(
  id: string,
  input: PatientInput
): Promise<Patient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .update(inputToRow(input))
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Couldn't update patient: ${error.message}`);
  return data ? rowToPatient(data) : null;
}

export async function setPatientArchived(
  id: string,
  archived: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update patient: ${error.message}`);
}
