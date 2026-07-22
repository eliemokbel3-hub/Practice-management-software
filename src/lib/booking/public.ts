// Everything the public booking pages need, running server-side with the
// service-role client (patients aren't signed in). Every query filters by
// clinic explicitly, and only booking-relevant fields ever leave the server.

import { createAdminClient } from "@/lib/supabase/admin";
import { bookingSettingsFrom, type BookingSettings } from "./settings";
import {
  computeAvailability,
  mergeAvailability,
  type DayAvailability,
  type BusyInterval,
} from "./availability";
import { dateKeyInTz } from "./timezone";
import { sendAndLog } from "@/lib/email/resend";
import { getSendTemplate } from "@/lib/data/message-templates";
import {
  confirmationEmail,
  cancellationEmail,
  rescheduleEmail,
  clinicNotificationEmail,
  type EmailClinic,
  type EmailAppointment,
} from "@/lib/email/templates";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PublicClinic {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  logo: string | null;
  logoDark: string | null;
  brandColor: string | null;
  booking: BookingSettings;
}

export interface PublicAppointmentType {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  durationMinutes: number;
  priceCents: number;
}

function rowToPublicClinic(row: any): PublicClinic {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    timezone: row.timezone,
    phone: row.phone,
    email: row.email,
    address: row.address,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    logo: row.logo ?? null,
    logoDark: row.logo_dark ?? null,
    brandColor: row.brand_color ?? null,
    booking: bookingSettingsFrom(row.settings),
  };
}

function emailClinic(c: PublicClinic): EmailClinic {
  return {
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    suburb: c.suburb,
    state: c.state,
    postcode: c.postcode,
  };
}

export async function getClinicBySlug(slug: string): Promise<PublicClinic | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("clinics")
    .select("id, slug, name, timezone, phone, email, address, suburb, state, postcode, logo, logo_dark, brand_color, settings")
    .eq("slug", slug)
    .maybeSingle();
  return data ? rowToPublicClinic(data) : null;
}

export async function listBookableTypes(
  clinicId: string
): Promise<PublicAppointmentType[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointment_types")
    .select("id, name, description, category, duration_minutes, price_cents")
    .eq("clinic_id", clinicId)
    .eq("bookable_online", true)
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
  }));
}

/**
 * Available slots for an appointment type over `days` calendar days starting
 * at `fromDate` (clinic-timezone "YYYY-MM-DD"). Looks at every practitioner
 * who offers the type; a slot lists the practitioner it would book with.
 */
export async function getAvailability(
  clinic: PublicClinic,
  appointmentTypeId: string,
  fromDate: string,
  days: number
): Promise<{ type: PublicAppointmentType; days: DayAvailability[] } | null> {
  const admin = createAdminClient();

  const { data: typeRow } = await admin
    .from("appointment_types")
    .select("id, name, description, category, duration_minutes, price_cents, buffer_before_minutes, buffer_after_minutes")
    .eq("clinic_id", clinic.id)
    .eq("id", appointmentTypeId)
    .eq("bookable_online", true)
    .eq("is_active", true)
    .maybeSingle();
  if (!typeRow) return null;

  const { data: pract } = await admin
    .from("practitioner_appointment_types")
    .select("practitioner_id")
    .eq("clinic_id", clinic.id)
    .eq("appointment_type_id", appointmentTypeId);
  const practitionerIds = (pract ?? []).map((r: any) => r.practitioner_id);

  const now = new Date();
  const earliestStart = new Date(
    now.getTime() + clinic.booking.minNoticeHours * 3_600_000
  );
  const latestStart = new Date(
    now.getTime() + clinic.booking.maxDaysAhead * 24 * 3_600_000
  );

  if (practitionerIds.length === 0) {
    return { type: publicType(typeRow), days: [] };
  }

  // One window query each for hours, appointments and blocked time.
  const windowStart = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const windowEnd = new Date(
    latestStart.getTime() + 24 * 3_600_000
  ).toISOString();

  const [{ data: hours }, { data: appts }, { data: blocks }] = await Promise.all([
    admin
      .from("working_hours")
      .select("practitioner_id, weekday, start_time, end_time")
      .eq("clinic_id", clinic.id)
      .in("practitioner_id", practitionerIds),
    admin
      .from("appointments")
      .select("practitioner_id, starts_at, ends_at")
      .eq("clinic_id", clinic.id)
      .in("practitioner_id", practitionerIds)
      .neq("status", "cancelled")
      .gte("starts_at", windowStart)
      .lt("starts_at", windowEnd),
    admin
      .from("blocked_times")
      .select("practitioner_id, starts_at, ends_at")
      .eq("clinic_id", clinic.id)
      .in("practitioner_id", practitionerIds)
      .gte("starts_at", windowStart)
      .lt("starts_at", windowEnd),
  ]);

  const perPractitioner = practitionerIds.map((pid) => {
    const busy: BusyInterval[] = [
      ...(appts ?? []).filter((a: any) => a.practitioner_id === pid),
      ...(blocks ?? []).filter((b: any) => b.practitioner_id === pid),
    ].map((b: any) => ({ startsAt: b.starts_at, endsAt: b.ends_at }));
    return computeAvailability({
      timeZone: clinic.timezone,
      workingHours: (hours ?? [])
        .filter((h: any) => h.practitioner_id === pid)
        .map((h: any) => ({
          weekday: h.weekday,
          startTime: h.start_time,
          endTime: h.end_time,
        })),
      busy,
      practitionerId: pid,
      durationMinutes: typeRow.duration_minutes,
      bufferBeforeMinutes: typeRow.buffer_before_minutes,
      bufferAfterMinutes: typeRow.buffer_after_minutes,
      slotIntervalMinutes: clinic.booking.slotIntervalMinutes,
      fromDate,
      days,
      earliestStart,
      latestStart,
    });
  });

  return { type: publicType(typeRow), days: mergeAvailability(perPractitioner) };
}

function publicType(row: any): PublicAppointmentType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
  };
}

export interface BookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null; // "YYYY-MM-DD"
  note: string | null;
}

export interface BookingResult {
  ok: boolean;
  error?: string;
  manageToken?: string;
  emailStatus?: "sent" | "failed" | "skipped";
}

/**
 * Match the booker to an existing patient (same email + name, both
 * case-insensitive) or create a new patient file. A same-email different-name
 * booker becomes a new file — safer than attaching to the wrong person; the
 * clinic can merge duplicates later.
 */
async function findOrCreatePatient(
  clinicId: string,
  details: BookingDetails
): Promise<{ id: string; isNew: boolean }> {
  const admin = createAdminClient();
  const { data: matches } = await admin
    .from("patients")
    .select("id, first_name, last_name")
    .eq("clinic_id", clinicId)
    .is("archived_at", null)
    .ilike("email", details.email.trim());
  const norm = (s: string) => s.trim().toLowerCase();
  const match = (matches ?? []).find(
    (p: any) =>
      norm(p.first_name) === norm(details.firstName) &&
      norm(p.last_name) === norm(details.lastName)
  );
  if (match) {
    // Keep contact details fresh; never touch clinical fields.
    await admin
      .from("patients")
      .update({ phone: details.phone.trim() || undefined })
      .eq("id", match.id)
      .eq("clinic_id", clinicId);
    return { id: match.id, isNew: false };
  }

  const { data: created, error } = await admin
    .from("patients")
    .insert({
      clinic_id: clinicId,
      first_name: details.firstName.trim(),
      last_name: details.lastName.trim(),
      email: details.email.trim(),
      phone: details.phone.trim() || null,
      date_of_birth: details.dateOfBirth,
      referral_source: "Online booking",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: created.id, isNew: true };
}

export async function createOnlineBooking(
  slug: string,
  appointmentTypeId: string,
  startsAtIso: string,
  details: BookingDetails
): Promise<BookingResult> {
  const clinic = await getClinicBySlug(slug);
  if (!clinic || !clinic.booking.enabled) {
    return { ok: false, error: "Online booking isn't available right now." };
  }

  // Re-check the slot is still free at submit time (someone may have taken
  // it while the form was open) and learn which practitioner it books with.
  const dayKey = dateKeyInTz(new Date(startsAtIso), clinic.timezone);
  const availability = await getAvailability(clinic, appointmentTypeId, dayKey, 1);
  if (!availability) {
    return { ok: false, error: "That appointment type isn't bookable online." };
  }
  const slot = availability.days
    .flatMap((d) => d.slots)
    .find((s) => new Date(s.startsAt).getTime() === new Date(startsAtIso).getTime());
  if (!slot) {
    return {
      ok: false,
      error: "Sorry — that time was just taken. Please pick another.",
    };
  }

  const admin = createAdminClient();
  const patient = await findOrCreatePatient(clinic.id, details);

  const { data: appt, error } = await admin
    .from("appointments")
    .insert({
      clinic_id: clinic.id,
      patient_id: patient.id,
      practitioner_id: slot.practitionerId,
      appointment_type_id: appointmentTypeId,
      starts_at: slot.startsAt,
      ends_at: slot.endsAt,
      booked_online: true,
      admin_notes: details.note?.trim() || null,
    })
    .select("id, manage_token")
    .single();
  if (error) {
    return { ok: false, error: `Couldn't complete the booking: ${error.message}` };
  }

  const emailAppt: EmailAppointment = {
    typeName: availability.type.name,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    timeZone: clinic.timezone,
    manageToken: appt.manage_token,
  };

  const message = confirmationEmail(
    emailClinic(clinic),
    details.firstName.trim(),
    emailAppt,
    clinic.booking.cancelMinHours,
    await getSendTemplate(clinic.id, "confirmation")
  );
  const sendResult = await sendAndLog({
    clinicId: clinic.id,
    clinicName: clinic.name,
    patientId: patient.id,
    appointmentId: appt.id,
    emailType: "confirmation",
    to: details.email.trim(),
    subject: message.subject,
    html: message.html,
    replyTo: clinic.email,
  });

  if (clinic.booking.notifyClinic && clinic.email) {
    const note = clinicNotificationEmail(
      emailClinic(clinic),
      "booked",
      `${details.firstName.trim()} ${details.lastName.trim()}`,
      emailAppt
    );
    await sendAndLog({
      clinicId: clinic.id,
      clinicName: clinic.name,
      patientId: patient.id,
      appointmentId: appt.id,
      emailType: "clinic_notification",
      to: clinic.email,
      subject: note.subject,
      html: note.html,
    });
  }

  return { ok: true, manageToken: appt.manage_token, emailStatus: sendResult.status };
}

// ---------------------------------------------------------------------------
// Manage-by-token (the emailed cancel/reschedule link)
// ---------------------------------------------------------------------------

export interface ManagedBooking {
  appointmentId: string;
  status: string;
  startsAt: string;
  endsAt: string;
  typeId: string | null;
  typeName: string;
  patientFirstName: string;
  patientEmail: string | null;
  clinic: PublicClinic;
  /** Whether self-service changes are still open under the clinic's policy. */
  canChange: boolean;
  isPast: boolean;
}

export async function getBookingByToken(
  token: string
): Promise<ManagedBooking | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select(
      "id, clinic_id, status, starts_at, ends_at, appointment_type_id, appointment_types(name), patients(first_name, email)"
    )
    .eq("manage_token", token)
    .maybeSingle();
  if (!data) return null;

  const { data: clinicRow } = await admin
    .from("clinics")
    .select("id, slug, name, timezone, phone, email, address, suburb, state, postcode, logo, logo_dark, brand_color, settings")
    .eq("id", data.clinic_id)
    .single();
  const clinic = rowToPublicClinic(clinicRow);

  const hoursUntil =
    (new Date(data.starts_at).getTime() - Date.now()) / 3_600_000;
  const patient: any = data.patients;
  const type: any = data.appointment_types;
  return {
    appointmentId: data.id,
    status: data.status,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    typeId: data.appointment_type_id,
    typeName: type?.name ?? "Appointment",
    patientFirstName: patient?.first_name ?? "there",
    patientEmail: patient?.email ?? null,
    clinic,
    canChange:
      data.status === "booked" && hoursUntil >= clinic.booking.cancelMinHours,
    isPast: hoursUntil < 0,
  };
}

export async function cancelBookingByToken(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const booking = await getBookingByToken(token);
  if (!booking) return { ok: false, error: "This link isn't valid any more." };
  if (booking.status !== "booked") {
    return { ok: false, error: "This appointment can't be cancelled online." };
  }
  if (!booking.canChange) {
    return {
      ok: false,
      error: `Online cancellation closes ${booking.clinic.booking.cancelMinHours} hours before the appointment — please phone the clinic instead.`,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("appointments")
    .update({
      status: "cancelled",
      cancellation_reason: "Cancelled by patient online",
    })
    .eq("id", booking.appointmentId)
    .eq("clinic_id", booking.clinic.id);
  if (error) return { ok: false, error: "Something went wrong — please try again." };

  const emailAppt: EmailAppointment = {
    typeName: booking.typeName,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    timeZone: booking.clinic.timezone,
    manageToken: token,
  };
  if (booking.patientEmail) {
    const message = cancellationEmail(
      emailClinic(booking.clinic),
      booking.patientFirstName,
      emailAppt,
      await getSendTemplate(booking.clinic.id, "cancellation")
    );
    await sendAndLog({
      clinicId: booking.clinic.id,
      clinicName: booking.clinic.name,
      appointmentId: booking.appointmentId,
      emailType: "cancellation",
      to: booking.patientEmail,
      subject: message.subject,
      html: message.html,
      replyTo: booking.clinic.email,
    });
  }
  if (booking.clinic.booking.notifyClinic && booking.clinic.email) {
    const note = clinicNotificationEmail(
      emailClinic(booking.clinic),
      "cancelled",
      booking.patientFirstName,
      emailAppt
    );
    await sendAndLog({
      clinicId: booking.clinic.id,
      clinicName: booking.clinic.name,
      appointmentId: booking.appointmentId,
      emailType: "clinic_notification",
      to: booking.clinic.email,
      subject: note.subject,
      html: note.html,
    });
  }
  return { ok: true };
}

export async function rescheduleBookingByToken(
  token: string,
  newStartsAtIso: string
): Promise<{ ok: boolean; error?: string }> {
  const booking = await getBookingByToken(token);
  if (!booking) return { ok: false, error: "This link isn't valid any more." };
  if (booking.status !== "booked" || !booking.typeId) {
    return { ok: false, error: "This appointment can't be changed online." };
  }
  if (!booking.canChange) {
    return {
      ok: false,
      error: `Online changes close ${booking.clinic.booking.cancelMinHours} hours before the appointment — please phone the clinic instead.`,
    };
  }

  const dayKey = dateKeyInTz(new Date(newStartsAtIso), booking.clinic.timezone);
  const availability = await getAvailability(
    booking.clinic,
    booking.typeId,
    dayKey,
    1
  );
  const slot = availability?.days
    .flatMap((d) => d.slots)
    .find(
      (s) =>
        new Date(s.startsAt).getTime() === new Date(newStartsAtIso).getTime()
    );
  if (!slot) {
    return {
      ok: false,
      error: "Sorry — that time was just taken. Please pick another.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("appointments")
    .update({
      starts_at: slot.startsAt,
      ends_at: slot.endsAt,
      practitioner_id: slot.practitionerId,
    })
    .eq("id", booking.appointmentId)
    .eq("clinic_id", booking.clinic.id);
  if (error) return { ok: false, error: "Something went wrong — please try again." };

  const emailAppt: EmailAppointment = {
    typeName: booking.typeName,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    timeZone: booking.clinic.timezone,
    manageToken: token,
  };
  if (booking.patientEmail) {
    const message = rescheduleEmail(
      emailClinic(booking.clinic),
      booking.patientFirstName,
      emailAppt,
      booking.clinic.booking.cancelMinHours
    );
    await sendAndLog({
      clinicId: booking.clinic.id,
      clinicName: booking.clinic.name,
      appointmentId: booking.appointmentId,
      emailType: "reschedule",
      to: booking.patientEmail,
      subject: message.subject,
      html: message.html,
      replyTo: booking.clinic.email,
    });
  }
  if (booking.clinic.booking.notifyClinic && booking.clinic.email) {
    const note = clinicNotificationEmail(
      emailClinic(booking.clinic),
      "rescheduled",
      booking.patientFirstName,
      emailAppt
    );
    await sendAndLog({
      clinicId: booking.clinic.id,
      clinicName: booking.clinic.name,
      appointmentId: booking.appointmentId,
      emailType: "clinic_notification",
      to: booking.clinic.email,
      subject: note.subject,
      html: note.html,
    });
  }
  return { ok: true };
}
