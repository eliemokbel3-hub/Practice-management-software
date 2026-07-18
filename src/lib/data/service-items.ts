import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { ServiceItem, ServiceItemInput } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToItem(row: any): ServiceItem {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    code: row.code,
    name: row.name,
    priceCents: row.price_cents,
    gstApplies: row.gst_applies,
    isActive: row.is_active,
  };
}

export async function listServiceItems(opts?: {
  includeInactive?: boolean;
}): Promise<ServiceItem[]> {
  const supabase = await createClient();
  let q = supabase.from("service_items").select("*").order("name");
  if (!opts?.includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(`Couldn't load billable items: ${error.message}`);
  return (data ?? []).map(rowToItem);
}

export async function getServiceItem(id: string): Promise<ServiceItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load billable item: ${error.message}`);
  return data ? rowToItem(data) : null;
}

export async function createServiceItem(input: ServiceItemInput): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { error } = await supabase.from("service_items").insert({
    clinic_id: profile.clinic_id,
    code: input.code,
    name: input.name,
    price_cents: input.priceCents,
    gst_applies: input.gstApplies,
  });
  if (error) throw new Error(`Couldn't create billable item: ${error.message}`);
}

export async function updateServiceItem(
  id: string,
  input: ServiceItemInput
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_items")
    .update({
      code: input.code,
      name: input.name,
      price_cents: input.priceCents,
      gst_applies: input.gstApplies,
    })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update billable item: ${error.message}`);
}

export async function setServiceItemActive(
  id: string,
  active: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_items")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update billable item: ${error.message}`);
}
