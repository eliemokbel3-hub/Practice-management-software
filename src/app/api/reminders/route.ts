// Trigger for due reminder emails. Two callers:
//  - Vercel Cron (or any scheduler) sends GET with the CRON_SECRET bearer
//    header — Vercel attaches `Authorization: Bearer $CRON_SECRET`
//    automatically when that env var is set.
//  - A signed-in clinic user may POST from Settings ("send now").
// Nobody else can trigger a run.

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/server";
import { sendDueReminders } from "@/lib/email/reminders";

// The email module imports child_process (Windows-only dev fallback), so this
// route must stay on the Node runtime; the duration guard keeps a busy
// sequential reminder run from being killed by the platform default.
export const runtime = "nodejs";
export const maxDuration = 60;

function hasValidSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  return Boolean(secret) && header === `Bearer ${secret}`;
}

// Cron path: secret-only — no session fallback for unauthenticated GETs.
export async function GET(request: NextRequest) {
  if (!hasValidSecret(request)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const result = await sendDueReminders();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const bySecret = hasValidSecret(request);
  const byUser = !bySecret && Boolean(await getCurrentProfile());
  if (!bySecret && !byUser) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const result = await sendDueReminders();
  return NextResponse.json(result);
}
