// Patient data access. Currently backed by an in-memory demo store so the app
// can be built and previewed before the Supabase database is connected.
// When Supabase is wired up, only this file changes — pages and forms stay as-is.

import { demoPatients } from "./demo-patients";
import type { Patient, PatientInput } from "@/lib/types";

// Survives hot reloads in dev; resets when the server restarts (fine for demo data).
const globalStore = globalThis as unknown as { __patients?: Patient[] };

function store(): Patient[] {
  if (!globalStore.__patients) {
    globalStore.__patients = demoPatients.map((p) => ({ ...p }));
  }
  return globalStore.__patients;
}

export async function listPatients(opts?: {
  query?: string;
  includeArchived?: boolean;
}): Promise<Patient[]> {
  const q = opts?.query?.trim().toLowerCase();
  return store()
    .filter((p) => (opts?.includeArchived ? true : !p.archivedAt))
    .filter((p) => {
      if (!q) return true;
      const haystack = [
        p.firstName,
        p.lastName,
        p.preferredName,
        p.email,
        p.phone?.replace(/\s/g, ""),
        p.suburb,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return q
        .split(/\s+/)
        .every((term) => haystack.includes(term.replace(/\s/g, "")));
    })
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    );
}

export async function getPatient(id: string): Promise<Patient | null> {
  return store().find((p) => p.id === id) ?? null;
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const now = new Date().toISOString();
  const patient: Patient = {
    ...input,
    id: `p-${crypto.randomUUID()}`,
    clinicId: demoPatients[0].clinicId,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  store().push(patient);
  return patient;
}

export async function updatePatient(
  id: string,
  input: PatientInput
): Promise<Patient | null> {
  const existing = store().find((p) => p.id === id);
  if (!existing) return null;
  Object.assign(existing, input, { updatedAt: new Date().toISOString() });
  return existing;
}

export async function setPatientArchived(
  id: string,
  archived: boolean
): Promise<Patient | null> {
  const existing = store().find((p) => p.id === id);
  if (!existing) return null;
  existing.archivedAt = archived ? new Date().toISOString() : null;
  existing.updatedAt = new Date().toISOString();
  return existing;
}
