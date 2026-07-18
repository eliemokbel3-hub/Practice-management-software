"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createAppointmentType,
  setAppointmentTypeActive,
  updateAppointmentType,
} from "@/lib/data/appointment-types";
import type { AppointmentTypeInput } from "@/lib/types";

function typeInputFromForm(form: FormData): AppointmentTypeInput {
  const name = String(form.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");
  const num = (key: string, fallback: number) => {
    const n = Number(form.get(key));
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    name,
    description: String(form.get("description") ?? "").trim() || null,
    category: String(form.get("category") ?? "").trim() || null,
    durationMinutes: Math.max(5, num("durationMinutes", 30)),
    priceCents: Math.round(num("price", 0) * 100),
    color: String(form.get("color") ?? "#7edcd2"),
    bufferBeforeMinutes: Math.max(0, num("bufferBefore", 0)),
    bufferAfterMinutes: Math.max(0, num("bufferAfter", 0)),
    bookableOnline: form.get("bookableOnline") === "on",
    isActive: true,
    maxPatients: Math.max(1, num("maxPatients", 1)),
    sortOrder: num("sortOrder", 0),
    defaultNoteTemplateId: String(form.get("defaultNoteTemplateId") ?? "") || null,
    defaultServiceItemId: String(form.get("defaultServiceItemId") ?? "") || null,
  };
}

export async function createAppointmentTypeAction(form: FormData) {
  await createAppointmentType(typeInputFromForm(form));
  revalidatePath("/settings/appointment-types");
  redirect("/settings/appointment-types");
}

export async function updateAppointmentTypeAction(id: string, form: FormData) {
  await updateAppointmentType(id, typeInputFromForm(form));
  revalidatePath("/settings/appointment-types");
  redirect("/settings/appointment-types");
}

export async function setTypeActiveAction(id: string, active: boolean) {
  await setAppointmentTypeActive(id, active);
  revalidatePath("/settings/appointment-types");
}
