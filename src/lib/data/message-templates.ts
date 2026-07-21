// Editable communication templates. Clinics reword the emails patients
// receive; sending falls back to built-in defaults when no template is set.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type TemplateKind =
  | "confirmation"
  | "reminder"
  | "cancellation"
  | "followup";

export interface MessageTemplate {
  id: string;
  kind: TemplateKind;
  subject: string;
  body: string;
  isActive: boolean;
}

export const TEMPLATE_META: Record<
  TemplateKind,
  { title: string; description: string }
> = {
  confirmation: {
    title: "Booking confirmation",
    description: "Sent as soon as an appointment is booked.",
  },
  reminder: {
    title: "Appointment reminder",
    description: "Sent before the appointment (timing set in Online bookings).",
  },
  cancellation: {
    title: "Cancellation notice",
    description: "Sent when an appointment is cancelled.",
  },
  followup: {
    title: "Follow-up message",
    description: "A check-in you can send after a visit.",
  },
};

export async function listMessageTemplates(): Promise<MessageTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_templates")
    .select("id, kind, subject, body, is_active")
    .eq("channel", "email");
  if (error) throw new Error(`Couldn't load templates: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    kind: r.kind,
    subject: r.subject,
    body: r.body,
    isActive: r.is_active,
  }));
}

export async function upsertMessageTemplate(
  kind: TemplateKind,
  subject: string,
  body: string,
  isActive: boolean
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not signed in.");
  const supabase = await createClient();
  const { error } = await supabase.from("message_templates").upsert(
    {
      clinic_id: profile.clinic_id,
      kind,
      channel: "email",
      subject,
      body,
      is_active: isActive,
    },
    { onConflict: "clinic_id,kind,channel" }
  );
  if (error) throw new Error(`Couldn't save template: ${error.message}`);
}

/**
 * Fetch an active template for sending (service-role: runs in booking/reminder
 * flows without a signed-in user). Returns null to use the built-in default.
 */
export async function getSendTemplate(
  clinicId: string,
  kind: TemplateKind
): Promise<{ subject: string; body: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("message_templates")
    .select("subject, body, is_active")
    .eq("clinic_id", clinicId)
    .eq("channel", "email")
    .eq("kind", kind)
    .maybeSingle();
  if (!data || !data.is_active || !data.body?.trim()) return null;
  return { subject: data.subject, body: data.body };
}
