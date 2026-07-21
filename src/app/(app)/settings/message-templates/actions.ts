"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  upsertMessageTemplate,
  type TemplateKind,
} from "@/lib/data/message-templates";

export async function saveMessageTemplateAction(form: FormData) {
  const kind = String(form.get("kind") ?? "") as TemplateKind;
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const isActive = form.get("isActive") === "on";
  await upsertMessageTemplate(kind, subject, body, isActive);
  revalidatePath("/settings/message-templates");
  redirect("/settings/message-templates");
}
