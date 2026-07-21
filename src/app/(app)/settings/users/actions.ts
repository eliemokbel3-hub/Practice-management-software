"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createStaff,
  setPractitionerTypes,
  setStaffActive,
  transferOwnership,
  updateStaff,
  type NewStaffInput,
  type StaffRole,
} from "@/lib/data/team";

export async function createStaffAction(
  input: NewStaffInput
): Promise<{ ok: boolean; tempPassword?: string; error?: string }> {
  if (!input.firstName || !input.lastName || !input.email) {
    return { ok: false, error: "Name and email are required." };
  }
  try {
    const { tempPassword } = await createStaff(input);
    revalidatePath("/settings/users");
    return { ok: true, tempPassword };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't add the team member.",
    };
  }
}

export async function toggleStaffActiveAction(id: string, active: boolean) {
  await setStaffActive(id, active);
  revalidatePath("/settings/users");
}

export async function transferOwnershipAction(id: string) {
  await transferOwnership(id);
  revalidatePath("/settings/users");
  redirect("/settings/users");
}

export async function updateStaffAction(id: string, form: FormData) {
  await updateStaff(id, {
    firstName: String(form.get("firstName") ?? "").trim(),
    lastName: String(form.get("lastName") ?? "").trim(),
    title: String(form.get("title") ?? "").trim() || null,
    role: String(form.get("role") ?? "practitioner") as StaffRole,
    ahpraNumber: String(form.get("ahpraNumber") ?? "").trim() || null,
  });
  await setPractitionerTypes(id, form.getAll("types").map(String));
  revalidatePath("/settings/users");
  redirect("/settings/users");
}
