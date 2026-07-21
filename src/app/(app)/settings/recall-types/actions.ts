"use server";

import { revalidatePath } from "next/cache";
import {
  createRecallType,
  deleteRecallType,
  setRecallTypeActive,
} from "@/lib/data/lists";

const path = "/settings/recall-types";

export async function createRecallTypeAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const intervalDays = Number(form.get("intervalDays")) || 182;
  const message = String(form.get("message") ?? "").trim() || null;
  await createRecallType(name, intervalDays, message);
  revalidatePath(path);
}
export async function toggleRecallTypeAction(id: string, active: boolean) {
  await setRecallTypeActive(id, active);
  revalidatePath(path);
}
export async function deleteRecallTypeAction(id: string) {
  await deleteRecallType(id);
  revalidatePath(path);
}
