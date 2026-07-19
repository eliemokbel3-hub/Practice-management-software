// Reminder emails: every clinic with reminders on gets one email per booked
// appointment, sent once the appointment is within the clinic's reminder
// window. The unique index on email_log guarantees no double-sends even if
// two runs overlap. Applies to all bookings, online or staff-made.

import { createAdminClient } from "@/lib/supabase/admin";
import { bookingSettingsFrom } from "@/lib/booking/settings";
import { sendAndLog, emailIsConfigured } from "./resend";
import { reminderEmail, type EmailClinic } from "./templates";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ReminderRunResult {
  configured: boolean;
  due: number;
  sent: number;
  skipped: number;
  failed: number;
}

export async function sendDueReminders(): Promise<ReminderRunResult> {
  const admin = createAdminClient();
  const result: ReminderRunResult = {
    configured: emailIsConfigured(),
    due: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  const { data: clinics } = await admin
    .from("clinics")
    .select("id, name, timezone, phone, email, address, suburb, state, postcode, settings");

  for (const clinicRow of clinics ?? []) {
    const settings = bookingSettingsFrom(clinicRow.settings);
    if (!settings.remindersEnabled) continue;

    const now = Date.now();
    const windowEnd = new Date(
      now + settings.reminderHoursBefore * 3_600_000
    ).toISOString();

    const { data: appts } = await admin
      .from("appointments")
      .select(
        "id, starts_at, ends_at, manage_token, appointment_types(name), patients(id, first_name, email)"
      )
      .eq("clinic_id", clinicRow.id)
      .eq("status", "booked")
      .gte("starts_at", new Date(now).toISOString())
      .lte("starts_at", windowEnd);
    if (!appts?.length) continue;

    // One query for which of these already had their reminder.
    const ids = appts.map((a: any) => a.id);
    const { data: alreadySent } = await admin
      .from("email_log")
      .select("appointment_id")
      .in("appointment_id", ids)
      .eq("email_type", "reminder")
      .eq("status", "sent");
    const done = new Set((alreadySent ?? []).map((r: any) => r.appointment_id));

    const clinic: EmailClinic = {
      name: clinicRow.name,
      phone: clinicRow.phone,
      email: clinicRow.email,
      address: clinicRow.address,
      suburb: clinicRow.suburb,
      state: clinicRow.state,
      postcode: clinicRow.postcode,
    };

    for (const appt of appts as any[]) {
      if (done.has(appt.id)) continue;
      const patient = appt.patients;
      if (!patient?.email) continue;
      result.due += 1;

      const message = reminderEmail(
        clinic,
        patient.first_name,
        {
          typeName: appt.appointment_types?.name ?? "Appointment",
          startsAt: appt.starts_at,
          endsAt: appt.ends_at,
          timeZone: clinicRow.timezone,
          manageToken: appt.manage_token,
        },
        settings.cancelMinHours
      );
      const sendResult = await sendAndLog({
        clinicId: clinicRow.id,
        clinicName: clinicRow.name,
        patientId: patient.id,
        appointmentId: appt.id,
        emailType: "reminder",
        to: patient.email,
        subject: message.subject,
        html: message.html,
        replyTo: clinicRow.email,
      });
      if (sendResult.status === "sent") result.sent += 1;
      else if (sendResult.status === "skipped") result.skipped += 1;
      else result.failed += 1;
    }
  }
  return result;
}
