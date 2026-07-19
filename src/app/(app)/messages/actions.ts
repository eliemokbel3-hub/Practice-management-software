"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendMessage } from "@/lib/data/messages";

export async function sendMessageAction(recipientId: string, form: FormData) {
  const body = String(form.get("body") ?? "").trim();
  if (body) await sendMessage(recipientId, body);
  revalidatePath("/messages");
  redirect(`/messages?with=${recipientId}`);
}
