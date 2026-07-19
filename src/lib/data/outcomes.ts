// Clinic-side data access for outcome measures (signed-in users; RLS scopes
// everything to the clinic). The patient-facing side is lib/outcomes/public.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { MeasureDefinition, OutcomeMeasure } from "@/lib/outcomes/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function listMeasures(): Promise<OutcomeMeasure[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outcome_measures")
    .select("id, code, name, description, definition")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(`Couldn't load outcome measures: ${error.message}`);
  return (data ?? []) as OutcomeMeasure[];
}

export interface PatientMeasureRequest {
  id: string;
  token: string;
  measureId: string;
  measureCode: string;
  measureName: string;
  unit: string;
  higherIsBetter: boolean;
  createdAt: string;
  sentAt: string | null;
  response: {
    score: number | null;
    display: string;
    band: string | null;
    completedAt: string;
  } | null;
}

export async function listRequestsForPatient(
  patientId: string
): Promise<PatientMeasureRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outcome_measure_requests")
    .select(
      "id, token, measure_id, created_at, sent_at, outcome_measures(code, name, definition), outcome_measure_responses(score, subscores, completed_at)"
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load outcome measures: ${error.message}`);
  return (data ?? []).map((row: any) => {
    const measure = row.outcome_measures;
    const definition = measure?.definition as MeasureDefinition | undefined;
    const resp = row.outcome_measure_responses;
    return {
      id: row.id,
      token: row.token,
      measureId: row.measure_id,
      measureCode: measure?.code ?? "",
      measureName: measure?.name ?? "Outcome measure",
      unit: definition?.scoring.unit ?? "",
      higherIsBetter: definition?.scoring.higherIsBetter ?? false,
      createdAt: row.created_at,
      sentAt: row.sent_at,
      response: resp
        ? {
            score: resp.score === null ? null : Number(resp.score),
            display: resp.subscores?.display ?? String(resp.score ?? "—"),
            band: resp.subscores?.band ?? null,
            completedAt: resp.completed_at,
          }
        : null,
    };
  });
}

export async function createMeasureRequest(
  patientId: string,
  measureId: string
): Promise<{ id: string; token: string }> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outcome_measure_requests")
    .insert({
      clinic_id: profile.clinic_id,
      patient_id: patientId,
      measure_id: measureId,
      requested_by: profile.id,
    })
    .select("id, token")
    .single();
  if (error) throw new Error(`Couldn't create the questionnaire: ${error.message}`);
  return { id: data.id, token: data.token };
}

export async function markRequestSent(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("outcome_measure_requests")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", id);
}

export interface RecentResponse {
  requestId: string;
  patientId: string;
  patientName: string;
  measureName: string;
  display: string;
  band: string | null;
  completedAt: string;
}

export async function listRecentResponses(limit = 20): Promise<RecentResponse[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outcome_measure_responses")
    .select(
      "score, subscores, completed_at, outcome_measure_requests(id, patient_id, patients(first_name, last_name), outcome_measures(name))"
    )
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Couldn't load responses: ${error.message}`);
  return (data ?? []).map((row: any) => {
    const req = row.outcome_measure_requests;
    return {
      requestId: req?.id ?? "",
      patientId: req?.patient_id ?? "",
      patientName: req?.patients
        ? `${req.patients.first_name} ${req.patients.last_name}`
        : "Unknown patient",
      measureName: req?.outcome_measures?.name ?? "Outcome measure",
      display: row.subscores?.display ?? String(row.score ?? "—"),
      band: row.subscores?.band ?? null,
      completedAt: row.completed_at,
    };
  });
}
