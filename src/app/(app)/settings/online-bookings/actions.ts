"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateBookingConfig } from "@/lib/data/clinic";
import { getCurrentProfile } from "@/lib/supabase/server";
import { sendDueReminders } from "@/lib/email/reminders";
import { BOOKING_DEFAULTS } from "@/lib/booking/settings";

export async function updateBookingSettingsAction(form: FormData) {
  const num = (key: string, fallback: number) => {
    const v = Number(form.get(key));
    return Number.isFinite(v) && v >= 0 ? v : fallback;
  };
  const slug = String(form.get("slug") ?? "")
    .trim()
    .toLowerCase();
  await updateBookingConfig(slug, {
    enabled: form.get("enabled") === "on",
    minNoticeHours: num("minNoticeHours", BOOKING_DEFAULTS.minNoticeHours),
    maxDaysAhead: num("maxDaysAhead", BOOKING_DEFAULTS.maxDaysAhead),
    slotIntervalMinutes:
      num("slotIntervalMinutes", BOOKING_DEFAULTS.slotIntervalMinutes) ||
      BOOKING_DEFAULTS.slotIntervalMinutes,
    cancelMinHours: num("cancelMinHours", BOOKING_DEFAULTS.cancelMinHours),
    welcomeMessage: String(form.get("welcomeMessage") ?? "").trim() || null,
    remindersEnabled: form.get("remindersEnabled") === "on",
    reminderHoursBefore: num(
      "reminderHoursBefore",
      BOOKING_DEFAULTS.reminderHoursBefore
    ),
    notifyClinic: form.get("notifyClinic") === "on",
    // Privacy fields live under Patient privacy; not written from this form.
    privacyNote: null,
    requireConsent: false,
  });
  revalidatePath("/settings/online-bookings");
  redirect("/settings");
}

export async function sendRemindersNowAction() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not signed in.");
  const result = await sendDueReminders();
  const query = new URLSearchParams({
    ran: "1",
    sent: String(result.sent),
    skipped: String(result.skipped),
    failed: String(result.failed),
  });
  redirect(`/settings/online-bookings?${query}`);
}
