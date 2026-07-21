"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createLetterTemplate,
  deleteLetterTemplate,
  saveLetterTemplate,
} from "@/lib/data/templates";

export async function createLetterAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const id = await createLetterTemplate(name);
  redirect(`/settings/letter-templates/${id}/edit`);
}

export async function saveLetterAction(id: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim() || "Untitled letter";
  const body = String(form.get("body") ?? "");
  await saveLetterTemplate(id, name, body);
  revalidatePath("/settings/letter-templates");
  redirect("/settings/letter-templates");
}

export async function deleteLetterAction(id: string) {
  await deleteLetterTemplate(id);
  revalidatePath("/settings/letter-templates");
}
