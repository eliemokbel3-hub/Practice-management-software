// Core domain types. These mirror the database schema in supabase/migrations/
// — keep the two in sync when either changes.

export type Sex = "Female" | "Male" | "Non-binary" | "Prefer not to say";

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  dateOfBirth: string | null; // ISO date, e.g. "1988-04-12"
  sex: Sex | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  occupation: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  medicalHistory: string | null;
  alerts: string | null;
  referralSource: string | null;
  concession: string | null;
  healthFundName: string | null;
  healthFundMemberNumber: string | null;
  /** Values for clinic-defined custom fields, keyed by field id. */
  custom: Record<string, string>;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PatientInput = Omit<
  Patient,
  "id" | "clinicId" | "archivedAt" | "createdAt" | "updatedAt"
>;

export interface AppointmentType {
  id: string;
  clinicId: string;
  name: string;
  description: string | null;
  category: string | null;
  durationMinutes: number;
  priceCents: number;
  color: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  bookableOnline: boolean;
  isActive: boolean;
  maxPatients: number;
  sortOrder: number;
  defaultNoteTemplateId: string | null;
  defaultServiceItemId: string | null;
}

export type AppointmentTypeInput = Omit<AppointmentType, "id" | "clinicId">;

export type AppointmentStatus =
  | "booked"
  | "arrived"
  | "completed"
  | "cancelled"
  | "did_not_arrive";

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  practitionerId: string;
  appointmentTypeId: string | null;
  startsAt: string; // ISO timestamp
  endsAt: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  adminNotes: string | null;
  recurrenceGroup: string | null;
  bookedOnline: boolean;
  // joined for display
  patientName?: string;
  typeName?: string;
  typeColor?: string;
}

export interface WorkingHours {
  id: string;
  practitionerId: string;
  weekday: number; // 0 = Sunday
  startTime: string; // "09:00:00"
  endTime: string;
}

export interface BlockedTime {
  id: string;
  practitionerId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export type NoteQuestionType = "text" | "paragraph" | "checkbox" | "date";

export interface NoteQuestion {
  key: string;
  label: string;
  type: NoteQuestionType;
  /** Pre-filled starting text for paragraph questions (e.g. "Site - \nChron - "). */
  prefill?: string;
  /** The statement being agreed to, for checkbox questions. */
  text?: string;
}

export interface NoteSection {
  key: string;
  label: string;
  description?: string;
  questions: NoteQuestion[];
}

export interface NoteTemplate {
  id: string;
  clinicId: string;
  name: string;
  sections: NoteSection[];
  isDefault: boolean;
  isActive: boolean;
}

/**
 * A note stores its own copy of the template structure plus the answers,
 * so later template edits never change what an existing note says.
 * Answer keys are "sectionKey.questionKey".
 */
export interface NoteContent {
  sections: NoteSection[];
  answers: Record<string, string | boolean>;
}

export type NoteStatus = "draft" | "final";

export interface ClinicalNote {
  id: string;
  clinicId: string;
  patientId: string;
  practitionerId: string;
  appointmentId: string | null;
  templateId: string | null;
  content: NoteContent;
  status: NoteStatus;
  finalisedAt: string | null;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  practitionerName?: string;
  revisionCount?: number;
}

export interface Clinic {
  id: string;
  name: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  abn: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  /** Percent-free decimal, e.g. 0.10 for 10% GST. */
  gstRate: number;
  invoiceTitle: string;
  /** Optional note printed at the foot of invoices (payment terms, etc.). */
  invoiceFooter: string | null;
  /** Re-encoded raster data URL of the clinic logo, or null. */
  logo: string | null;
  /** Brand colour (hex) that drives the theme, or null for the default. */
  brandColor: string | null;
}

export interface ServiceItem {
  id: string;
  clinicId: string;
  code: string;
  name: string;
  priceCents: number;
  gstApplies: boolean;
  isActive: boolean;
}

export type ServiceItemInput = Omit<ServiceItem, "id" | "clinicId">;

export interface PaymentType {
  id: string;
  clinicId: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export type InvoiceStatus = "draft" | "issued" | "paid" | "void";

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  serviceItemId: string | null;
  appointmentId: string | null;
  description: string;
  code: string | null;
  quantity: number;
  unitPriceCents: number;
  gstCents: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  paymentTypeId: string | null;
  paymentTypeName?: string;
  paidAt: string;
  reference: string | null;
}

export interface Invoice {
  id: string;
  clinicId: string;
  patientId: string;
  practitionerId: string | null;
  invoiceNumber: number;
  status: InvoiceStatus;
  issuedDate: string | null;
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  notes: string | null;
  createdAt: string;
  patientName?: string;
  paidCents?: number;
  lines?: InvoiceLine[];
  payments?: Payment[];
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export function fullName(p: Patient): string {
  const base = `${p.firstName} ${p.lastName}`;
  return p.preferredName ? `${base} (${p.preferredName})` : base;
}

export function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
