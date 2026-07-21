// Clinic-defined custom fields added to every patient file. Values are stored
// on the patient row in the `custom` jsonb column, keyed by field id.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type CustomFieldType =
  | "text"
  | "paragraph"
  | "date"
  | "select"
  | "checkbox";

export interface CustomField {
  id: string;
  label: string;
  fieldType: CustomFieldType;
  options: string[];
  isActive: boolean;
  sortOrder: number;
}

export async function listCustomFields(
  includeInactive = false
): Promise<CustomField[]> {
  const supabase = await createClient();
  let q = supabase.from("custom_patient_fields").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(`Couldn't load custom fields: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    label: r.label,
    fieldType: r.field_type,
    options: Array.isArray(r.options) ? r.options : [],
    isActive: r.is_active,
    sortOrder: r.sort_order,
  }));
}

export async function createCustomField(
  label: string,
  fieldType: CustomFieldType,
  options: string[]
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("custom_patient_fields")
    .select("sort_order")
    .eq("clinic_id", profile.clinic_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("custom_patient_fields").insert({
    clinic_id: profile.clinic_id,
    label,
    field_type: fieldType,
    options,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw new Error(`Couldn't add field: ${error.message}`);
}

export async function setCustomFieldActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_patient_fields")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update field: ${error.message}`);
}

export async function deleteCustomField(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_patient_fields")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`Couldn't remove field: ${error.message}`);
}
