// Users & practitioners: the clinic's staff accounts. Creating a login needs
// the Supabase admin API (service role), so those calls use the admin client;
// everything reads through RLS as the signed-in user.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type StaffRole = "owner" | "practitioner" | "reception";

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string;
  role: StaffRole;
  ahpraNumber: string | null;
  isActive: boolean;
  isSelf: boolean;
  isOwner: boolean;
}

export async function listStaff(): Promise<StaffMember[]> {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, title, email, role, ahpra_number, is_active")
    .order("is_active", { ascending: false })
    .order("first_name");
  if (error) throw new Error(`Couldn't load your team: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    title: r.title,
    email: r.email,
    role: r.role,
    ahpraNumber: r.ahpra_number,
    isActive: r.is_active,
    isSelf: r.id === profile?.id,
    isOwner: r.role === "owner",
  }));
}

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  const staff = await listStaff();
  return staff.find((s) => s.id === id) ?? null;
}

function randomPassword(): string {
  // Readable temporary password: two words-ish + digits.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export interface NewStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
  role: StaffRole;
  ahpraNumber: string | null;
  password: string | null;
}

/**
 * Create a staff login and profile. Only an owner may do this. Returns the
 * temporary password so the owner can pass it on (never logged, never stored
 * in plain text beyond Supabase auth's hash).
 */
export async function createStaff(
  input: NewStaffInput
): Promise<{ tempPassword: string }> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  if (profile.role !== "owner") {
    throw new Error("Only the account owner can add team members.");
  }
  const admin = createAdminClient();
  const password = input.password?.trim() || randomPassword();

  const { data: created, error: authError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password,
      email_confirm: true,
    });
  if (authError || !created.user) {
    throw new Error(
      authError?.message.includes("already been registered")
        ? "That email already has an account."
        : `Couldn't create the login: ${authError?.message ?? "unknown error"}`
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    clinic_id: profile.clinic_id,
    role: input.role,
    first_name: input.firstName,
    last_name: input.lastName,
    title: input.title,
    email: input.email,
    ahpra_number: input.ahpraNumber,
  });
  if (profileError) {
    // Roll back the orphaned auth user so the email can be reused.
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(`Couldn't create the profile: ${profileError.message}`);
  }
  return { tempPassword: password };
}

export async function updateStaff(
  id: string,
  input: {
    firstName: string;
    lastName: string;
    title: string | null;
    role: StaffRole;
    ahpraNumber: string | null;
  }
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    throw new Error("Only the account owner can edit team members.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      title: input.title,
      role: input.role,
      ahpra_number: input.ahpraNumber,
    })
    .eq("id", id);
  if (error) throw new Error(`Couldn't save changes: ${error.message}`);
}

/**
 * Reset a team member's password to a fresh temporary one and return it, so
 * the owner can pass it on. Owner-only; the target must be in the owner's
 * clinic (RLS on the profiles lookup enforces that).
 */
export async function resetStaffPassword(
  id: string
): Promise<{ tempPassword: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    throw new Error("Only the account owner can reset passwords.");
  }
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!target) throw new Error("That team member isn't in your clinic.");

  const admin = createAdminClient();
  const password = randomPassword();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) throw new Error(`Couldn't reset password: ${error.message}`);
  return { tempPassword: password };
}

export async function setStaffActive(id: string, active: boolean): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    throw new Error("Only the account owner can change team members.");
  }
  if (id === profile.id) throw new Error("You can't deactivate your own login.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update: ${error.message}`);
}

/** Hand the owner role to another active member; the current owner becomes a practitioner. */
export async function transferOwnership(toId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    throw new Error("Only the current owner can transfer ownership.");
  }
  const supabase = await createClient();
  const { error: e1 } = await supabase
    .from("profiles")
    .update({ role: "owner" })
    .eq("id", toId);
  if (e1) throw new Error(`Couldn't transfer ownership: ${e1.message}`);
  await supabase
    .from("profiles")
    .update({ role: "practitioner" })
    .eq("id", profile.id);
}

// ---- Which appointment types a practitioner offers ----
export async function listPractitionerTypeIds(
  practitionerId: string
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioner_appointment_types")
    .select("appointment_type_id")
    .eq("practitioner_id", practitionerId);
  return (data ?? []).map((r: any) => r.appointment_type_id);
}

export async function setPractitionerTypes(
  practitionerId: string,
  typeIds: string[]
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not signed in.");
  const supabase = await createClient();
  await supabase
    .from("practitioner_appointment_types")
    .delete()
    .eq("practitioner_id", practitionerId);
  if (typeIds.length === 0) return;
  const { error } = await supabase
    .from("practitioner_appointment_types")
    .insert(
      typeIds.map((id) => ({
        practitioner_id: practitionerId,
        appointment_type_id: id,
        clinic_id: profile.clinic_id,
      }))
    );
  if (error) throw new Error(`Couldn't save services: ${error.message}`);
}
