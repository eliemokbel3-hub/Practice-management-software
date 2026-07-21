// CSV export of the clinic's own data. Runs as the signed-in user, so RLS
// keeps it to their clinic. Reached from Settings → Data exports.

import { NextResponse, type NextRequest } from "next/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
  return lines.join("\r\n");
}

const QUERIES: Record<string, { table: string; select: string; order: string }> = {
  patients: {
    table: "patients",
    select:
      "first_name, last_name, preferred_name, date_of_birth, sex, email, phone, address_line1, suburb, state, postcode, occupation, referral_source, concession, health_fund_name, health_fund_member_number, medical_history, alerts, created_at",
    order: "last_name",
  },
  appointments: {
    table: "appointments",
    select:
      "starts_at, ends_at, status, booked_online, admin_notes, patients(first_name, last_name), appointment_types(name)",
    order: "starts_at",
  },
  invoices: {
    table: "invoices",
    select:
      "invoice_number, status, issued_date, subtotal_cents, gst_cents, total_cents, patients(first_name, last_name), created_at",
    order: "invoice_number",
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const { type } = await params;
  const q = QUERIES[type];
  if (!q) return NextResponse.json({ error: "Unknown export" }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(q.table)
    .select(q.select)
    .order(q.order);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten joined names into plain columns. Note typeof null === "object",
  // so null scalars are kept (as empty), only real join objects are replaced.
  const rows = (data ?? []).map((r: any) => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(r)) {
      if (k === "patients") {
        out.patient = v ? `${(v as any).first_name} ${(v as any).last_name}` : "";
      } else if (k === "appointment_types") {
        out.appointment_type = v ? (v as any).name : "";
      } else if (v !== null && typeof v === "object") {
        continue; // skip any other nested object
      } else {
        out[k] = v;
      }
    }
    return out;
  });

  const csv = toCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${date}.csv"`,
    },
  });
}
