import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { Clinic } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToClinic(row: any): Clinic {
  const settings = row.settings ?? {};
  return {
    id: row.id,
    name: row.name,
    timezone: row.timezone,
    phone: row.phone,
    email: row.email,
    abn: row.abn,
    address: row.address,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    gstRate: typeof settings.gst_rate === "number" ? settings.gst_rate : 0.1,
    invoiceTitle: settings.invoice_title ?? "Tax Invoice",
  };
}

export async function getClinic(): Promise<Clinic> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clinics").select("*").single();
  if (error) throw new Error(`Couldn't load clinic details: ${error.message}`);
  return rowToClinic(data);
}

export async function updateClinic(input: {
  name: string;
  phone: string | null;
  email: string | null;
  abn: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  gstRate: number;
  invoiceTitle: string;
}): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("clinics")
    .select("settings")
    .eq("id", profile.clinic_id)
    .single();
  if (loadError) throw new Error(`Couldn't save clinic: ${loadError.message}`);
  const { error } = await supabase
    .from("clinics")
    .update({
      name: input.name,
      phone: input.phone,
      email: input.email,
      abn: input.abn,
      address: input.address,
      suburb: input.suburb,
      state: input.state,
      postcode: input.postcode,
      settings: {
        ...existing.settings,
        gst_rate: input.gstRate,
        invoice_title: input.invoiceTitle,
      },
    })
    .eq("id", profile.clinic_id);
  if (error) throw new Error(`Couldn't save clinic: ${error.message}`);
}
