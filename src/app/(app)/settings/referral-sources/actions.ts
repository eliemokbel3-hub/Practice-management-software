"use server";

import { revalidatePath } from "next/cache";
import {
  createReferralSource,
  deleteReferralSource,
  setReferralSourceActive,
} from "@/lib/data/lists";

const path = "/settings/referral-sources";

export async function createReferralSourceAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await createReferralSource(name);
  revalidatePath(path);
}
export async function toggleReferralSourceAction(id: string, active: boolean) {
  await setReferralSourceActive(id, active);
  revalidatePath(path);
}
export async function deleteReferralSourceAction(id: string) {
  await deleteReferralSource(id);
  revalidatePath(path);
}
