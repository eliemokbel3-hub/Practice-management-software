// Online-booking behaviour, stored per clinic in clinics.settings jsonb so
// every clinic tunes it in Settings — nothing about it is hard-coded.

export interface BookingSettings {
  /** Master switch for the public booking page. */
  enabled: boolean;
  /** Patients can't book a slot starting sooner than this many hours away. */
  minNoticeHours: number;
  /** How far into the future the booking page offers slots. */
  maxDaysAhead: number;
  /** Offered start times step by this many minutes (e.g. every 30 min). */
  slotIntervalMinutes: number;
  /** Self-service cancel/reschedule closes this many hours before the visit. */
  cancelMinHours: number;
  /** Optional welcome text shown at the top of the booking page. */
  welcomeMessage: string | null;
  /** Send automatic reminder emails before appointments. */
  remindersEnabled: boolean;
  /** How many hours before the appointment the reminder goes out. */
  reminderHoursBefore: number;
  /** Also email the clinic when someone books, cancels or reschedules online. */
  notifyClinic: boolean;
}

export const BOOKING_DEFAULTS: BookingSettings = {
  enabled: true,
  minNoticeHours: 2,
  maxDaysAhead: 60,
  slotIntervalMinutes: 30,
  cancelMinHours: 24,
  welcomeMessage: null,
  remindersEnabled: true,
  reminderHoursBefore: 24,
  notifyClinic: true,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function bookingSettingsFrom(settings: any): BookingSettings {
  const s = settings ?? {};
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
  const bool = (v: unknown, fallback: boolean) =>
    typeof v === "boolean" ? v : fallback;
  return {
    enabled: bool(s.booking_enabled, BOOKING_DEFAULTS.enabled),
    minNoticeHours: num(s.booking_min_notice_hours, BOOKING_DEFAULTS.minNoticeHours),
    maxDaysAhead: num(s.booking_max_days_ahead, BOOKING_DEFAULTS.maxDaysAhead),
    slotIntervalMinutes:
      num(s.booking_slot_interval_minutes, BOOKING_DEFAULTS.slotIntervalMinutes) ||
      BOOKING_DEFAULTS.slotIntervalMinutes,
    cancelMinHours: num(s.booking_cancel_min_hours, BOOKING_DEFAULTS.cancelMinHours),
    welcomeMessage:
      typeof s.booking_welcome_message === "string" &&
      s.booking_welcome_message.trim()
        ? s.booking_welcome_message.trim()
        : null,
    remindersEnabled: bool(s.reminders_enabled, BOOKING_DEFAULTS.remindersEnabled),
    reminderHoursBefore: num(s.reminder_hours_before, BOOKING_DEFAULTS.reminderHoursBefore),
    notifyClinic: bool(s.booking_notify_clinic, BOOKING_DEFAULTS.notifyClinic),
  };
}

/** The jsonb keys to merge into clinics.settings when saving. */
export function bookingSettingsToJson(s: BookingSettings): Record<string, unknown> {
  return {
    booking_enabled: s.enabled,
    booking_min_notice_hours: s.minNoticeHours,
    booking_max_days_ahead: s.maxDaysAhead,
    booking_slot_interval_minutes: s.slotIntervalMinutes,
    booking_cancel_min_hours: s.cancelMinHours,
    booking_welcome_message: s.welcomeMessage,
    reminders_enabled: s.remindersEnabled,
    reminder_hours_before: s.reminderHoursBefore,
    booking_notify_clinic: s.notifyClinic,
  };
}
