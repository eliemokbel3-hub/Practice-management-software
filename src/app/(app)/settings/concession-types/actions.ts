"use server";

import { revalidatePath } from "next/cache";
import {
  createConcessionType,
  deleteConcessionType,
  setConcessionTypeActive,
} from "@/lib/data/lists";

const path = "/settings/concession-types";

export async function createConcessionTypeAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await createConcessionType(name);
  revalidatePath(path);
}
export async function toggleConcessionTypeAction(id: string, active: boolean) {
  await setConcessionTypeActive(id, active);
  revalidatePath(path);
}
export async function deleteConcessionTypeAction(id: string) {
  await deleteConcessionType(id);
  revalidatePath(path);
}
