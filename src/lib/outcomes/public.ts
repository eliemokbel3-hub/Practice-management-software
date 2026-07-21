// Patient-facing side of outcome measures: the emailed/shared link serves a
// questionnaire without a login. Runs with the service role; the token is the
// authorisation, and only the patient's first name ever reaches the page.

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreMeasure } from "./scoring";
import type { MeasureDefinition } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PublicMeasureRequest {
  requestId: string;
  measureName: string;
  definition: MeasureDefinition;
  patientFirstName: string;
  clinicName: string;
  clinicLogo: string | null;
  clinicBrandColor: string | null;
  completed: boolean;
}

export async function getMeasureRequestByToken(
  token: string
): Promise<PublicMeasureRequest | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("outcome_measure_requests")
    .select(
      "id, clinic_id, outcome_measures(name, definition), patients(first_name), outcome_measure_responses(id), clinics(name, logo, brand_color)"
    )
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const measure: any = data.outcome_measures;
  const patient: any = data.patients;
  const clinic: any = data.clinics;
  return {
    requestId: data.id,
    measureName: measure?.name ?? "Questionnaire",
    definition: measure?.definition as MeasureDefinition,
    patientFirstName: patient?.first_name ?? "there",
    clinicName: clinic?.name ?? "Your clinic",
    clinicLogo: clinic?.logo ?? null,
    clinicBrandColor: clinic?.brand_color ?? null,
    completed: Boolean(data.outcome_measure_responses),
  };
}

export async function submitMeasureResponse(
  token: string,
  answers: any
): Promise<{ ok: boolean; error?: string; display?: string }> {
  const request = await getMeasureRequestByToken(token);
  if (!request) return { ok: false, error: "This link isn't valid any more." };
  if (request.completed) {
    return { ok: false, error: "This questionnaire has already been completed." };
  }

  const result = scoreMeasure(request.definition, answers);
  if (result.score === null) {
    return {
      ok: false,
      error:
        request.definition.kind === "psfs"
          ? "Please add at least one activity and its rating."
          : "Please answer the questions before submitting.",
    };
  }

  const admin = createAdminClient();
  const { data: reqRow } = await admin
    .from("outcome_measure_requests")
    .select("id, clinic_id")
    .eq("token", token)
    .single();
  const { error } = await admin.from("outcome_measure_responses").insert({
    clinic_id: reqRow!.clinic_id,
    request_id: reqRow!.id,
    answers,
    score: result.score,
    subscores: {
      display: result.display,
      band: result.band,
      answered: result.answered,
    },
  });
  if (error) {
    return { ok: false, error: "Something went wrong — please try again." };
  }
  return { ok: true, display: result.display };
}
