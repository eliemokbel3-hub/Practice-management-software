"use server";

import { revalidatePath } from "next/cache";
import {
  createCustomField,
  deleteCustomField,
  setCustomFieldActive,
  type CustomFieldType,
} from "@/lib/data/custom-fields";

const path = "/settings/custom-fields";

export async function createCustomFieldAction(form: FormData) {
  const label = String(form.get("label") ?? "").trim();
  if (!label) return;
  const fieldType = String(form.get("fieldType") ?? "text") as CustomFieldType;
  const options = String(form.get("options") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  await createCustomField(label, fieldType, options);
  revalidatePath(path);
}
export async function toggleCustomFieldAction(id: string, active: boolean) {
  await setCustomFieldActive(id, active);
  revalidatePath(path);
}
export async function deleteCustomFieldAction(id: string) {
  await deleteCustomField(id);
  revalidatePath(path);
}
