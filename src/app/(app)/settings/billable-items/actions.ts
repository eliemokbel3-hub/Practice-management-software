"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createServiceItem,
  setServiceItemActive,
  updateServiceItem,
} from "@/lib/data/service-items";
import type { ServiceItemInput } from "@/lib/types";

function itemInputFromForm(form: FormData): ServiceItemInput {
  const name = String(form.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");
  const price = Number(form.get("price"));
  return {
    code: String(form.get("code") ?? "").trim(),
    name,
    priceCents: Math.round((Number.isFinite(price) ? price : 0) * 100),
    gstApplies: form.get("gstApplies") === "on",
    isActive: true,
  };
}

export async function createServiceItemAction(form: FormData) {
  await createServiceItem(itemInputFromForm(form));
  revalidatePath("/settings/billable-items");
  redirect("/settings/billable-items");
}

export async function updateServiceItemAction(id: string, form: FormData) {
  await updateServiceItem(id, itemInputFromForm(form));
  revalidatePath("/settings/billable-items");
  redirect("/settings/billable-items");
}

export async function setServiceItemActiveAction(id: string, active: boolean) {
  await setServiceItemActive(id, active);
  revalidatePath("/settings/billable-items");
}
