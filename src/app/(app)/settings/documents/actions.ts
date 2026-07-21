"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateDocumentsSettings } from "@/lib/data/clinic";

export async function saveDocumentsAction(form: FormData) {
  const footer = String(form.get("invoiceFooter") ?? "").trim() || null;
  await updateDocumentsSettings(footer);
  revalidatePath("/settings/documents");
  redirect("/settings");
}
