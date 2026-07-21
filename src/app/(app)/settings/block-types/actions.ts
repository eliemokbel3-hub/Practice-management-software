"use server";

import { revalidatePath } from "next/cache";
import {
  createBlockType,
  deleteBlockType,
  setBlockTypeActive,
} from "@/lib/data/lists";

const path = "/settings/block-types";

export async function createBlockTypeAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const color = String(form.get("color") ?? "#94a3b8");
  await createBlockType(name, color);
  revalidatePath(path);
}
export async function toggleBlockTypeAction(id: string, active: boolean) {
  await setBlockTypeActive(id, active);
  revalidatePath(path);
}
export async function deleteBlockTypeAction(id: string) {
  await deleteBlockType(id);
  revalidatePath(path);
}
