// Template libraries: patient intake/consent forms, body charts and letters.
// All per-clinic and RLS-scoped.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { NoteQuestion, NoteSection } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Patient form templates (intake / consent). Reuse the note section shape.
// ---------------------------------------------------------------------------
export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  sections: NoteSection[];
  isActive: boolean;
}

export async function listFormTemplates(): Promise<FormTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_form_templates")
    .select("*")
    .order("name");
  if (error) throw new Error(`Couldn't load form templates: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    sections: Array.isArray(r.sections) ? r.sections : [],
    isActive: r.is_active,
  }));
}

export async function getFormTemplate(id: string): Promise<FormTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_form_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load form template: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    sections: Array.isArray(data.sections) ? data.sections : [],
    isActive: data.is_active,
  };
}

export async function createFormTemplate(
  name: string,
  description: string | null
): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_form_templates")
    .insert({
      clinic_id: profile.clinic_id,
      name,
      description,
      sections: [{ key: "main", label: "", questions: [] }],
    })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't create form: ${error.message}`);
  return data.id;
}

export async function saveFormQuestions(
  id: string,
  questions: NoteQuestion[]
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("patient_form_templates")
    .update({ sections: [{ key: "main", label: "", questions }] })
    .eq("id", id);
  if (error) throw new Error(`Couldn't save form: ${error.message}`);
}

export async function deleteFormTemplate(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("patient_form_templates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Couldn't remove form: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Body chart templates
// ---------------------------------------------------------------------------
export interface BodyChartTemplate {
  id: string;
  name: string;
  region: string;
  isActive: boolean;
  sortOrder: number;
}

export const BODY_REGIONS: { value: string; label: string }[] = [
  { value: "full_body", label: "Full body" },
  { value: "spine", label: "Spine" },
  { value: "upper", label: "Upper limb" },
  { value: "lower", label: "Lower limb" },
  { value: "head_neck", label: "Head & neck" },
];

export async function listBodyCharts(
  includeInactive = false
): Promise<BodyChartTemplate[]> {
  const supabase = await createClient();
  let q = supabase.from("body_chart_templates").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(`Couldn't load body charts: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    region: r.region,
    isActive: r.is_active,
    sortOrder: r.sort_order,
  }));
}

export async function createBodyChart(
  name: string,
  region: string
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("body_chart_templates")
    .select("sort_order")
    .eq("clinic_id", profile.clinic_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("body_chart_templates").insert({
    clinic_id: profile.clinic_id,
    name,
    region,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw new Error(`Couldn't add body chart: ${error.message}`);
}

export async function setBodyChartActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("body_chart_templates")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update: ${error.message}`);
}
export async function deleteBodyChart(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("body_chart_templates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Couldn't remove: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Letter templates
// ---------------------------------------------------------------------------
export interface LetterTemplate {
  id: string;
  name: string;
  body: string;
  isActive: boolean;
}

export async function listLetterTemplates(): Promise<LetterTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("letter_templates")
    .select("*")
    .order("name");
  if (error) throw new Error(`Couldn't load letters: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    body: r.body,
    isActive: r.is_active,
  }));
}

export async function getLetterTemplate(
  id: string
): Promise<LetterTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("letter_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load letter: ${error.message}`);
  return data
    ? { id: data.id, name: data.name, body: data.body, isActive: data.is_active }
    : null;
}

export async function createLetterTemplate(name: string): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("letter_templates")
    .insert({ clinic_id: profile.clinic_id, name, body: "" })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't create letter: ${error.message}`);
  return data.id;
}

export async function saveLetterTemplate(
  id: string,
  name: string,
  body: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("letter_templates")
    .update({ name, body })
    .eq("id", id);
  if (error) throw new Error(`Couldn't save letter: ${error.message}`);
}

export async function deleteLetterTemplate(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("letter_templates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Couldn't remove letter: ${error.message}`);
}
