// Patient-facing email bodies: simple, readable HTML that renders everywhere.
// All wording keeps the clinic front and centre; PracticeHub stays invisible.

import { formatLongDateInTz, formatTimeInTz } from "@/lib/booking/timezone";

export function appBaseUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3001"
  );
}

export interface EmailAppointment {
  typeName: string;
  startsAt: string; // ISO UTC
  endsAt: string;
  timeZone: string;
  manageToken: string;
}

export interface EmailClinic {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clinicAddress(c: EmailClinic): string | null {
  const parts = [c.address, [c.suburb, c.state, c.postcode].filter(Boolean).join(" ")]
    .filter((p) => p && p.trim());
  return parts.length ? parts.join(", ") : null;
}

function layout(clinic: EmailClinic, bodyHtml: string): string {
  const address = clinicAddress(clinic);
  const contact = [
    address ? esc(address) : null,
    clinic.phone ? `Phone ${esc(clinic.phone)}` : null,
    clinic.email ? esc(clinic.email) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px 16px; color: #14201f;">
  <h2 style="margin: 0 0 16px; font-size: 20px;">${esc(clinic.name)}</h2>
  ${bodyHtml}
  <hr style="border: none; border-top: 1px solid #e4e7e7; margin: 24px 0 12px;" />
  <p style="font-size: 12px; color: #8b9695; margin: 0;">${contact}</p>
</div>`;
}

function detailsBlock(appt: EmailAppointment): string {
  const starts = new Date(appt.startsAt);
  const mins = Math.round(
    (new Date(appt.endsAt).getTime() - starts.getTime()) / 60_000
  );
  return `
  <div style="background: #f1f6f5; border-radius: 10px; padding: 16px 18px; margin: 16px 0;">
    <p style="margin: 0; font-weight: 600;">${esc(appt.typeName)}</p>
    <p style="margin: 6px 0 0;">${esc(formatLongDateInTz(starts, appt.timeZone))}</p>
    <p style="margin: 2px 0 0;">${esc(formatTimeInTz(starts, appt.timeZone))} (${mins} minutes)</p>
  </div>`;
}

function manageBlock(appt: EmailAppointment, cancelMinHours: number): string {
  const url = `${appBaseUrl()}/book/manage/${appt.manageToken}`;
  const policy =
    cancelMinHours > 0
      ? ` Online changes close ${cancelMinHours} hours before your appointment — after that, please phone the clinic.`
      : "";
  return `
  <p style="margin: 16px 0 0;">Need to change it? You can
    <a href="${url}" style="color: #0d9488;">cancel or reschedule online</a>.${policy}
  </p>`;
}

/** A saved template's subject + body, with {placeholders}. */
export interface CustomTemplate {
  subject: string;
  body: string;
}

/**
 * Render a clinic's editable template into a finished email. Scalar
 * placeholders are substituted (and escaped); {appointment_details} and
 * {manage_link} expand to their styled blocks.
 */
export function renderTemplate(
  clinic: EmailClinic,
  template: CustomTemplate,
  patientFirstName: string,
  appt: EmailAppointment,
  cancelMinHours: number
): { subject: string; html: string } {
  const starts = new Date(appt.startsAt);
  const scalars: Record<string, string> = {
    patient_first_name: patientFirstName,
    clinic_name: clinic.name,
    appointment_type: appt.typeName,
    appointment_date: formatLongDateInTz(starts, appt.timeZone),
    appointment_time: formatTimeInTz(starts, appt.timeZone),
  };
  const subject = Object.entries(scalars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    template.subject || `${clinic.name}`
  );
  let body = esc(template.body);
  for (const [k, v] of Object.entries(scalars)) {
    body = body.replaceAll(`{${k}}`, esc(v));
  }
  body = body
    .replaceAll("{appointment_details}", detailsBlock(appt))
    .replaceAll("{manage_link}", manageBlock(appt, cancelMinHours))
    .replace(/\n/g, "<br>");
  return { subject, html: layout(clinic, `<p style="margin:0;">${body}</p>`) };
}

export function confirmationEmail(
  clinic: EmailClinic,
  patientFirstName: string,
  appt: EmailAppointment,
  cancelMinHours: number,
  template?: CustomTemplate | null
): { subject: string; html: string } {
  if (template)
    return renderTemplate(clinic, template, patientFirstName, appt, cancelMinHours);
  return {
    subject: `Appointment confirmed — ${clinic.name}`,
    html: layout(
      clinic,
      `
  <p style="margin: 0;">Hi ${esc(patientFirstName)},</p>
  <p style="margin: 12px 0 0;">Your appointment is confirmed:</p>
  ${detailsBlock(appt)}
  ${manageBlock(appt, cancelMinHours)}
  <p style="margin: 16px 0 0;">See you then!</p>`
    ),
  };
}

export function reminderEmail(
  clinic: EmailClinic,
  patientFirstName: string,
  appt: EmailAppointment,
  cancelMinHours: number,
  template?: CustomTemplate | null
): { subject: string; html: string } {
  if (template)
    return renderTemplate(clinic, template, patientFirstName, appt, cancelMinHours);
  return {
    subject: `Appointment reminder — ${clinic.name}`,
    html: layout(
      clinic,
      `
  <p style="margin: 0;">Hi ${esc(patientFirstName)},</p>
  <p style="margin: 12px 0 0;">A friendly reminder about your upcoming appointment:</p>
  ${detailsBlock(appt)}
  ${manageBlock(appt, cancelMinHours)}`
    ),
  };
}

export function cancellationEmail(
  clinic: EmailClinic,
  patientFirstName: string,
  appt: EmailAppointment,
  template?: CustomTemplate | null
): { subject: string; html: string } {
  if (template)
    return renderTemplate(clinic, template, patientFirstName, appt, 0);
  return {
    subject: `Appointment cancelled — ${clinic.name}`,
    html: layout(
      clinic,
      `
  <p style="margin: 0;">Hi ${esc(patientFirstName)},</p>
  <p style="margin: 12px 0 0;">This confirms your appointment has been cancelled:</p>
  ${detailsBlock(appt)}
  <p style="margin: 16px 0 0;">If this wasn't you, or you'd like to rebook, please get in touch with the clinic.</p>`
    ),
  };
}

export function rescheduleEmail(
  clinic: EmailClinic,
  patientFirstName: string,
  appt: EmailAppointment,
  cancelMinHours: number
): { subject: string; html: string } {
  return {
    subject: `Appointment updated — ${clinic.name}`,
    html: layout(
      clinic,
      `
  <p style="margin: 0;">Hi ${esc(patientFirstName)},</p>
  <p style="margin: 12px 0 0;">Your appointment has been moved. The new details:</p>
  ${detailsBlock(appt)}
  ${manageBlock(appt, cancelMinHours)}`
    ),
  };
}

export function outcomeMeasureEmail(
  clinic: EmailClinic,
  patientFirstName: string,
  measureName: string,
  url: string
): { subject: string; html: string } {
  return {
    subject: `A short questionnaire from ${clinic.name}`,
    html: layout(
      clinic,
      `
  <p style="margin: 0;">Hi ${esc(patientFirstName)},</p>
  <p style="margin: 12px 0 0;">As part of your care, we'd like you to fill in a short questionnaire — it helps us track how you're going between visits.</p>
  <div style="background: #f1f6f5; border-radius: 10px; padding: 16px 18px; margin: 16px 0;">
    <p style="margin: 0; font-weight: 600;">${esc(measureName)}</p>
    <p style="margin: 10px 0 0;"><a href="${url}" style="color: #0d9488;">Fill it in here</a> — it only takes a few minutes.</p>
  </div>
  <p style="margin: 16px 0 0;">Thank you!</p>`
    ),
  };
}

export function clinicNotificationEmail(
  clinic: EmailClinic,
  action: "booked" | "cancelled" | "rescheduled",
  patientName: string,
  appt: EmailAppointment
): { subject: string; html: string } {
  const verb =
    action === "booked"
      ? "New online booking"
      : action === "cancelled"
        ? "Online cancellation"
        : "Online reschedule";
  return {
    subject: `${verb}: ${patientName} — ${appt.typeName}`,
    html: layout(
      clinic,
      `
  <p style="margin: 0;"><strong>${verb}</strong> by ${esc(patientName)}:</p>
  ${detailsBlock(appt)}
  <p style="margin: 16px 0 0;"><a href="${appBaseUrl()}/calendar" style="color: #0d9488;">Open the calendar</a></p>`
    ),
  };
}
