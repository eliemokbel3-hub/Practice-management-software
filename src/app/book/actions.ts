"use server";

// Server actions behind the public booking pages. They run with the service
// role, so each one re-validates everything it's given — the browser is
// untrusted here (patients aren't signed in).

import {
  getClinicBySlug,
  getAvailability,
  createOnlineBooking,
  cancelBookingByToken,
  rescheduleBookingByToken,
  type BookingResult,
} from "@/lib/booking/public";
import type { DayAvailability } from "@/lib/booking/availability";

export async function fetchSlotsAction(
  slug: string,
  appointmentTypeId: string,
  fromDate: string
): Promise<{ days: DayAvailability[] } | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) return null;
  const clinic = await getClinicBySlug(slug);
  if (!clinic || !clinic.booking.enabled) return null;
  const availability = await getAvailability(clinic, appointmentTypeId, fromDate, 7);
  return availability ? { days: availability.days } : null;
}

export interface BookingFormInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  note: string;
}

export async function submitBookingAction(
  slug: string,
  appointmentTypeId: string,
  startsAtIso: string,
  form: BookingFormInput
): Promise<BookingResult> {
  const firstName = form.firstName?.trim() ?? "";
  const lastName = form.lastName?.trim() ?? "";
  const email = form.email?.trim() ?? "";
  const phone = form.phone?.trim() ?? "";
  if (!firstName || !lastName) {
    return { ok: false, error: "Please enter your first and last name." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!phone) {
    return { ok: false, error: "Please enter a phone number." };
  }
  const dateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth ?? "")
    ? form.dateOfBirth
    : null;

  return createOnlineBooking(slug, appointmentTypeId, startsAtIso, {
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    note: form.note?.trim() || null,
  });
}

export async function cancelBookingAction(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  return cancelBookingByToken(token);
}

export async function rescheduleBookingAction(
  token: string,
  newStartsAtIso: string
): Promise<{ ok: boolean; error?: string }> {
  return rescheduleBookingByToken(token, newStartsAtIso);
}
