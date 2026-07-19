// Trigger for due reminder emails. At deploy time a scheduler (Railway cron
// or similar) POSTs here with the CRON_SECRET; a signed-in clinic user may
// also trigger it from Settings ("send now"). Nobody else can.

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/server";
import { sendDueReminders } from "@/lib/email/reminders";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const bySecret = Boolean(secret) && header === `Bearer ${secret}`;
  const byUser = !bySecret && Boolean(await getCurrentProfile());
  if (!bySecret && !byUser) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const result = await sendDueReminders();
  return NextResponse.json(result);
}
