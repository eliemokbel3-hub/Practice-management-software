import { execFileSync } from "child_process";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Email sending via Resend's REST API (no SDK needed). Until the clinic's
 * Resend API key is set, sends are skipped — still recorded in email_log so
 * nothing silently disappears — and the app keeps working normally.
 */

/**
 * Resolve the Resend API key. Same approach as the Anthropic key: a normal
 * env var in production; in local dev on Windows also the registry-stored
 * user environment, in case the dev server started before `setx` ran.
 * The key value is never logged or returned to the client.
 */
function getApiKey(): string | null {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  if (process.platform === "win32") {
    try {
      const out = execFileSync(
        "reg",
        ["query", "HKCU\\Environment", "/v", "RESEND_API_KEY"],
        { encoding: "utf8" }
      );
      const match = out.match(/RESEND_API_KEY\s+REG_(?:EXPAND_)?SZ\s+(.+)/);
      if (match) return match[1].trim();
    } catch {
      // Not set — callers get a "skipped" result.
    }
  }
  return null;
}

export function emailIsConfigured(): boolean {
  return getApiKey() !== null;
}

/**
 * The From address. Resend's shared onboarding address works out of the box
 * for testing (delivers only to the account owner's inbox); a verified
 * domain address via RESEND_FROM_EMAIL is the production setup.
 */
function fromAddress(clinicName: string): string {
  const email = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  return `${clinicName.replace(/[<>"]/g, "")} <${email}>`;
}

export type EmailType =
  | "confirmation"
  | "reminder"
  | "cancellation"
  | "reschedule"
  | "clinic_notification"
  | "outcome_measure";

export interface SendEmailInput {
  clinicId: string;
  clinicName: string;
  patientId?: string | null;
  appointmentId?: string | null;
  emailType: EmailType;
  to: string;
  subject: string;
  html: string;
  replyTo?: string | null;
}

export interface SendResult {
  status: "sent" | "failed" | "skipped";
  error?: string;
}

/** Send one email and record the outcome in email_log. Never throws. */
export async function sendAndLog(input: SendEmailInput): Promise<SendResult> {
  const apiKey = getApiKey();
  let result: SendResult;

  if (!apiKey) {
    result = {
      status: "skipped",
      error: "Email isn't set up yet — no Resend API key on this computer.",
    };
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress(input.clinicName),
          to: [input.to],
          subject: input.subject,
          html: input.html,
          ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        }),
      });
      if (res.ok) {
        result = { status: "sent" };
      } else {
        const body = await res.text();
        result = { status: "failed", error: `Resend ${res.status}: ${body.slice(0, 500)}` };
      }
    } catch (e) {
      result = {
        status: "failed",
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  }

  try {
    const admin = createAdminClient();
    await admin.from("email_log").insert({
      clinic_id: input.clinicId,
      patient_id: input.patientId ?? null,
      appointment_id: input.appointmentId ?? null,
      email_type: input.emailType,
      to_email: input.to,
      subject: input.subject,
      status: result.status,
      error: result.error ?? null,
    });
  } catch {
    // Logging must never break the booking flow.
  }
  return result;
}
