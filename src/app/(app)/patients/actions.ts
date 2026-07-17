"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createPatient,
  updatePatient,
  setPatientArchived,
} from "@/lib/data/patients";
import type { PatientInput, Sex } from "@/lib/types";

function str(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function patientInputFromForm(form: FormData): PatientInput {
  const firstName = str(form, "firstName");
  const lastName = str(form, "lastName");
  if (!firstName || !lastName) {
    throw new Error("First and last name are required");
  }
  return {
    firstName,
    lastName,
    preferredName: str(form, "preferredName"),
    dateOfBirth: str(form, "dateOfBirth"),
    sex: (str(form, "sex") as Sex | null) ?? null,
    email: str(form, "email"),
    phone: str(form, "phone"),
    addressLine1: str(form, "addressLine1"),
    suburb: str(form, "suburb"),
    state: str(form, "state"),
    postcode: str(form, "postcode"),
    occupation: str(form, "occupation"),
    emergencyContactName: str(form, "emergencyContactName"),
    emergencyContactPhone: str(form, "emergencyContactPhone"),
    emergencyContactRelationship: str(form, "emergencyContactRelationship"),
    medicalHistory: str(form, "medicalHistory"),
    alerts: str(form, "alerts"),
    referralSource: str(form, "referralSource"),
    healthFundName: str(form, "healthFundName"),
    healthFundMemberNumber: str(form, "healthFundMemberNumber"),
  };
}

export async function createPatientAction(form: FormData) {
  const patient = await createPatient(patientInputFromForm(form));
  revalidatePath("/patients");
  redirect(`/patients/${patient.id}`);
}

export async function updatePatientAction(id: string, form: FormData) {
  await updatePatient(id, patientInputFromForm(form));
  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
  redirect(`/patients/${id}`);
}

export async function setArchivedAction(id: string, archived: boolean) {
  await setPatientArchived(id, archived);
  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
}
