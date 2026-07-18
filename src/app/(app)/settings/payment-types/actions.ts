"use server";

import { revalidatePath } from "next/cache";
import {
  createPaymentType,
  setPaymentTypeActive,
} from "@/lib/data/payment-types";

export async function createPaymentTypeAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");
  await createPaymentType(name);
  revalidatePath("/settings/payment-types");
}

export async function setPaymentTypeActiveAction(id: string, active: boolean) {
  await setPaymentTypeActive(id, active);
  revalidatePath("/settings/payment-types");
}
