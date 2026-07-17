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
  healthFundName: string | null;
  healthFundMemberNumber: string | null;
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
