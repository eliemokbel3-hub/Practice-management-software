"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createAppointment,
  rescheduleAppointment,
  setAppointmentStatus,
} from "@/lib/data/appointments";
import { getAppointmentType } from "@/lib/data/appointment-types";
import { createBlockedTime, deleteBlockedTime } from "@/lib/data/schedule";
import type { AppointmentStatus } from "@/lib/types";
import { dateKey } from "@/lib/calendar-utils";

function parseDateTime(form: FormData): Date {
  const date = String(form.get("date") ?? "");
  const time = String(form.get("time") ?? "");
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Please pick a valid date and time.");
  }
  return parsed;
}

async function createFromForm(form: FormData): Promise<string> {
  const patientId = String(form.get("patientId") ?? "");
  const appointmentTypeId = String(form.get("appointmentTypeId") ?? "");
  if (!patientId) throw new Error("Please choose a patient.");
  const type = await getAppointmentType(appointmentTypeId);
  if (!type) throw new Error("Please choose an appointment type.");

  const startsAt = parseDateTime(form);
  const repeat = String(form.get("repeat") ?? "none") as
    | "none"
    | "weekly"
    | "fortnightly";
  return createAppointment({
    patientId,
    appointmentTypeId,
    startsAt,
    durationMinutes: type.durationMinutes,
    adminNotes: String(form.get("adminNotes") ?? "").trim() || null,
    repeat,
    repeatCount: Number(form.get("repeatCount") ?? 1) || 1,
  });
}

export async function createAppointmentAction(form: FormData) {
  const id = await createFromForm(form);
  revalidatePath("/calendar");
  redirect(`/calendar/appointments/${id}`);
}

/**
 * Same booking, but for the in-calendar dialog: no redirect, and problems
 * come back as a message the dialog can show instead of an error page.
 */
export async function createAppointmentInlineAction(
  form: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await createFromForm(form);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't book the appointment.",
    };
  }
  revalidatePath("/calendar");
  return { ok: true };
}

export async function rescheduleAppointmentAction(
  id: string,
  durationMinutes: number,
  form: FormData
) {
  const startsAt = parseDateTime(form);
  await rescheduleAppointment(id, startsAt, durationMinutes);
  revalidatePath("/calendar");
  redirect(`/calendar?view=day&date=${dateKey(startsAt)}`);
}

export async function setStatusAction(id: string, status: AppointmentStatus) {
  await setAppointmentStatus(id, status);
  revalidatePath("/calendar");
  revalidatePath(`/calendar/appointments/${id}`);
}

export async function cancelAppointmentAction(id: string, form: FormData) {
  const reason = String(form.get("reason") ?? "").trim();
  await setAppointmentStatus(id, "cancelled", reason || undefined);
  revalidatePath("/calendar");
  redirect("/calendar");
}

export async function createBlockedTimeAction(form: FormData) {
  const date = String(form.get("date") ?? "");
  const start = new Date(`${date}T${String(form.get("startTime") ?? "")}`);
  const end = new Date(`${date}T${String(form.get("endTime") ?? "")}`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw new Error("End time must be after start time.");
  }
  await createBlockedTime(
    start,
    end,
    String(form.get("reason") ?? "").trim() || null
  );
  revalidatePath("/calendar");
  redirect(`/calendar?view=day&date=${date}`);
}

export async function deleteBlockedTimeAction(id: string) {
  await deleteBlockedTime(id);
  revalidatePath("/calendar");
  redirect("/calendar");
}
