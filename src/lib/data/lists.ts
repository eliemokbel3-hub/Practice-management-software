// Managed settings lists: block types, recall types, referral sources,
// concession types and tax rates. All are per-clinic and RLS-scoped.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface NamedListItem {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}
export interface BlockType extends NamedListItem {
  color: string;
}
export interface RecallType extends NamedListItem {
  intervalDays: number;
  message: string | null;
}
export interface TaxRate extends NamedListItem {
  rate: number;
  isDefault: boolean;
}

async function nextSort(table: string, clinicId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from(table)
    .select("sort_order")
    .eq("clinic_id", clinicId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

async function listFrom(
  table: string,
  includeInactive: boolean
): Promise<any[]> {
  const supabase = await createClient();
  let q = supabase.from(table).select("*").order("sort_order");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(`Couldn't load ${table}: ${error.message}`);
  return data ?? [];
}

async function setActive(table: string, id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update: ${error.message}`);
}

async function remove(table: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(`Couldn't remove: ${error.message}`);
}

const named = (r: any): NamedListItem => ({
  id: r.id,
  name: r.name,
  isActive: r.is_active,
  sortOrder: r.sort_order,
});

// ---- Referral sources ----
export const listReferralSources = (inc = false) =>
  listFrom("referral_sources", inc).then((r) => r.map(named));
export async function createReferralSource(name: string) {
  const p = await getCurrentProfile();
  if (!p) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { error } = await supabase.from("referral_sources").insert({
    clinic_id: p.clinic_id,
    name,
    sort_order: await nextSort("referral_sources", p.clinic_id),
  });
  if (error) throw new Error(error.message);
}
export const setReferralSourceActive = (id: string, a: boolean) =>
  setActive("referral_sources", id, a);
export const deleteReferralSource = (id: string) =>
  remove("referral_sources", id);

// ---- Concession types ----
export const listConcessionTypes = (inc = false) =>
  listFrom("concession_types", inc).then((r) => r.map(named));
export async function createConcessionType(name: string) {
  const p = await getCurrentProfile();
  if (!p) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { error } = await supabase.from("concession_types").insert({
    clinic_id: p.clinic_id,
    name,
    sort_order: await nextSort("concession_types", p.clinic_id),
  });
  if (error) throw new Error(error.message);
}
export const setConcessionTypeActive = (id: string, a: boolean) =>
  setActive("concession_types", id, a);
export const deleteConcessionType = (id: string) =>
  remove("concession_types", id);

// ---- Block types ----
export const listBlockTypes = (inc = false): Promise<BlockType[]> =>
  listFrom("block_types", inc).then((r) =>
    r.map((x) => ({ ...named(x), color: x.color }))
  );
export async function createBlockType(name: string, color: string) {
  const p = await getCurrentProfile();
  if (!p) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { error } = await supabase.from("block_types").insert({
    clinic_id: p.clinic_id,
    name,
    color,
    sort_order: await nextSort("block_types", p.clinic_id),
  });
  if (error) throw new Error(error.message);
}
export const setBlockTypeActive = (id: string, a: boolean) =>
  setActive("block_types", id, a);
export const deleteBlockType = (id: string) => remove("block_types", id);

// ---- Recall types ----
export const listRecallTypes = (inc = false): Promise<RecallType[]> =>
  listFrom("recall_types", inc).then((r) =>
    r.map((x) => ({
      ...named(x),
      intervalDays: x.interval_days,
      message: x.message,
    }))
  );
export async function createRecallType(
  name: string,
  intervalDays: number,
  message: string | null
) {
  const p = await getCurrentProfile();
  if (!p) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { error } = await supabase.from("recall_types").insert({
    clinic_id: p.clinic_id,
    name,
    interval_days: intervalDays,
    message,
    sort_order: await nextSort("recall_types", p.clinic_id),
  });
  if (error) throw new Error(error.message);
}
export const setRecallTypeActive = (id: string, a: boolean) =>
  setActive("recall_types", id, a);
export const deleteRecallType = (id: string) => remove("recall_types", id);

// ---- Tax rates ----
export const listTaxRates = (inc = false): Promise<TaxRate[]> =>
  listFrom("tax_rates", inc).then((r) =>
    r.map((x) => ({
      ...named(x),
      rate: Number(x.rate),
      isDefault: x.is_default,
    }))
  );
export async function createTaxRate(name: string, rate: number) {
  const p = await getCurrentProfile();
  if (!p) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { error } = await supabase.from("tax_rates").insert({
    clinic_id: p.clinic_id,
    name,
    rate,
    sort_order: await nextSort("tax_rates", p.clinic_id),
  });
  if (error) throw new Error(error.message);
}
export const setTaxRateActive = (id: string, a: boolean) =>
  setActive("tax_rates", id, a);
export const deleteTaxRate = (id: string) => remove("tax_rates", id);

/** Make one tax rate the default (clears the others) and sync clinic GST. */
export async function setTaxRateDefault(id: string) {
  const p = await getCurrentProfile();
  if (!p) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { data: rate } = await supabase
    .from("tax_rates")
    .select("rate")
    .eq("id", id)
    .single();
  await supabase
    .from("tax_rates")
    .update({ is_default: false })
    .eq("clinic_id", p.clinic_id);
  const { error } = await supabase
    .from("tax_rates")
    .update({ is_default: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
  // Keep the clinic's active GST rate in step with the default tax rate,
  // so invoicing uses whatever the clinic marks as default.
  const { data: clinic } = await supabase
    .from("clinics")
    .select("settings")
    .eq("id", p.clinic_id)
    .single();
  await supabase
    .from("clinics")
    .update({
      settings: { ...(clinic?.settings ?? {}), gst_rate: Number(rate?.rate ?? 0) },
    })
    .eq("id", p.clinic_id);
}
