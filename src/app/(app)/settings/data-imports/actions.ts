"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export interface ImportPatientRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export async function importPatientsAction(
  rows: ImportPatientRow[]
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in." };
  const clean = rows
    .map((r) => ({
      first: r.firstName?.trim(),
      last: r.lastName?.trim(),
      email: r.email?.trim() || null,
      phone: r.phone?.trim() || null,
      dob: /^\d{4}-\d{2}-\d{2}$/.test(r.dateOfBirth?.trim() ?? "")
        ? r.dateOfBirth.trim()
        : null,
    }))
    .filter((r) => r.first && r.last);
  if (clean.length === 0) {
    return { ok: false, error: "No rows with both a first and last name were found." };
  }
  if (clean.length > 1000) {
    return { ok: false, error: "Please import at most 1000 patients at a time." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("patients").insert(
    clean.map((r) => ({
      clinic_id: profile.clinic_id,
      first_name: r.first,
      last_name: r.last,
      email: r.email,
      phone: r.phone,
      date_of_birth: r.dob,
      referral_source: "Imported",
    }))
  );
  if (error) return { ok: false, error: `Import failed: ${error.message}` };
  revalidatePath("/patients");
  return { ok: true, count: clean.length };
}
