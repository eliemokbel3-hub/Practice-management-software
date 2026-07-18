import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { PaymentType } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToType(row: any): PaymentType {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export async function listPaymentTypes(opts?: {
  includeInactive?: boolean;
}): Promise<PaymentType[]> {
  const supabase = await createClient();
  let q = supabase.from("payment_types").select("*").order("sort_order");
  if (!opts?.includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(`Couldn't load payment types: ${error.message}`);
  return (data ?? []).map(rowToType);
}

export async function createPaymentType(name: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("payment_types")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("payment_types").insert({
    clinic_id: profile.clinic_id,
    name,
    sort_order: (existing?.sort_order ?? 0) + 1,
  });
  if (error) throw new Error(`Couldn't add payment type: ${error.message}`);
}

export async function setPaymentTypeActive(
  id: string,
  active: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_types")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update payment type: ${error.message}`);
}
