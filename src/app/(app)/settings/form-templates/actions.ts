"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createFormTemplate,
  deleteFormTemplate,
  saveFormQuestions,
} from "@/lib/data/templates";
import type { NoteQuestion } from "@/lib/types";

export async function createFormAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const description = String(form.get("description") ?? "").trim() || null;
  const id = await createFormTemplate(name, description);
  redirect(`/settings/form-templates/${id}/edit`);
}

export async function saveFormQuestionsAction(
  id: string,
  questions: NoteQuestion[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    await saveFormQuestions(id, questions);
    revalidatePath("/settings/form-templates");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save the form.",
    };
  }
}

export async function deleteFormAction(id: string) {
  await deleteFormTemplate(id);
  revalidatePath("/settings/form-templates");
}
