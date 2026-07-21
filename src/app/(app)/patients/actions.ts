"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createPatient,
  updatePatient,
  setPatientArchived,
} from "@/lib/data/patients";
import { listCustomFields, type CustomField } from "@/lib/data/custom-fields";
import type { PatientInput, Sex } from "@/lib/types";

function str(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function customFromForm(
  form: FormData,
  fields: CustomField[]
): Record<string, string> {
  const custom: Record<string, string> = {};
  for (const f of fields) {
    if (f.fieldType === "checkbox") {
      custom[f.id] = form.get(`custom_${f.id}`) === "on" ? "Yes" : "";
    } else {
      custom[f.id] = String(form.get(`custom_${f.id}`) ?? "").trim();
    }
  }
  return custom;
}

function patientInputFromForm(
  form: FormData,
  custom: Record<string, string>
): PatientInput {
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
    concession: str(form, "concession"),
    healthFundName: str(form, "healthFundName"),
    healthFundMemberNumber: str(form, "healthFundMemberNumber"),
    custom,
  };
}

export async function createPatientAction(form: FormData) {
  const fields = await listCustomFields();
  const input = patientInputFromForm(form, customFromForm(form, fields));
  const patient = await createPatient(input);
  revalidatePath("/patients");
  redirect(`/patients/${patient.id}`);
}

export async function updatePatientAction(id: string, form: FormData) {
  const fields = await listCustomFields();
  const input = patientInputFromForm(form, customFromForm(form, fields));
  await updatePatient(id, input);
  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
  redirect(`/patients/${id}`);
}

export async function setArchivedAction(id: string, archived: boolean) {
  await setPatientArchived(id, archived);
  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
}
