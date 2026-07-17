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
