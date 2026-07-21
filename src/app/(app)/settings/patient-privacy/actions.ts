"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updatePrivacySettings } from "@/lib/data/clinic";

export async function savePrivacyAction(form: FormData) {
  const note = String(form.get("privacyNote") ?? "").trim() || null;
  const requireConsent = form.get("requireConsent") === "on";
  await updatePrivacySettings(note, requireConsent);
  revalidatePath("/settings/patient-privacy");
  redirect("/settings");
}
