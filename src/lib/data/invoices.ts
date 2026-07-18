import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { getClinic } from "./clinic";
import { getServiceItem } from "./service-items";
import type { Invoice, InvoiceLine, Payment } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToInvoice(row: any): Invoice {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    practitionerId: row.practitioner_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    issuedDate: row.issued_date,
    subtotalCents: row.subtotal_cents,
    gstCents: row.gst_cents,
    totalCents: row.total_cents,
    notes: row.notes,
    createdAt: row.created_at,
    patientName: row.patients
      ? `${row.patients.first_name} ${row.patients.last_name}`
      : undefined,
    paidCents: Array.isArray(row.payments)
      ? row.payments.reduce(
          (sum: number, p: any) => sum + (p.amount_cents ?? 0),
          0
        )
      : undefined,
  };
}

function rowToLine(row: any): InvoiceLine {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    serviceItemId: row.service_item_id,
    appointmentId: row.appointment_id,
    description: row.description,
    code: row.code,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    gstCents: row.gst_cents,
  };
}

function rowToPayment(row: any): Payment {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    amountCents: row.amount_cents,
    paymentTypeId: row.payment_type_id,
    paymentTypeName: row.payment_types?.name ?? undefined,
    paidAt: row.paid_at,
    reference: row.reference,
  };
}

export async function listInvoices(opts?: {
  status?: string;
}): Promise<Invoice[]> {
  const supabase = await createClient();
  let q = supabase
    .from("invoices")
    .select("*, patients(first_name, last_name), payments(amount_cents)")
    .order("invoice_number", { ascending: false });
  if (opts?.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw new Error(`Couldn't load invoices: ${error.message}`);
  return (data ?? []).map(rowToInvoice);
}

export async function listInvoicesForPatient(
  patientId: string
): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, patients(first_name, last_name), payments(amount_cents)")
    .eq("patient_id", patientId)
    .order("invoice_number", { ascending: false });
  if (error) throw new Error(`Couldn't load invoices: ${error.message}`);
  return (data ?? []).map(rowToInvoice);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "*, patients(first_name, last_name), invoice_lines(*), payments(*, payment_types(name))"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load invoice: ${error.message}`);
  if (!data) return null;
  const invoice = rowToInvoice(data);
  invoice.lines = (data.invoice_lines ?? []).map(rowToLine);
  const payments: Payment[] = (data.payments ?? [])
    .map(rowToPayment)
    .sort(
      (a: Payment, b: Payment) =>
        new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()
    );
  invoice.payments = payments;
  invoice.paidCents = payments.reduce((s, p) => s + p.amountCents, 0);
  return invoice;
}

async function recomputeTotals(invoiceId: string): Promise<void> {
  const supabase = await createClient();
  const { data: lines, error } = await supabase
    .from("invoice_lines")
    .select("quantity, unit_price_cents, gst_cents")
    .eq("invoice_id", invoiceId);
  if (error) throw new Error(`Couldn't update totals: ${error.message}`);
  const subtotal = (lines ?? []).reduce(
    (s, l) => s + l.quantity * l.unit_price_cents,
    0
  );
  const gst = (lines ?? []).reduce((s, l) => s + l.gst_cents, 0);
  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      subtotal_cents: subtotal,
      gst_cents: gst,
      total_cents: subtotal + gst,
    })
    .eq("id", invoiceId);
  if (updateError) throw new Error(`Couldn't update totals: ${updateError.message}`);
}

/**
 * Create a draft invoice for a patient. When created from an appointment,
 * the appointment type's default billable item becomes the first line.
 */
export async function createInvoice(input: {
  patientId: string;
  appointmentId?: string | null;
  defaultServiceItemId?: string | null;
}): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();

  const { data: maxRow } = await supabase
    .from("invoices")
    .select("invoice_number")
    .order("invoice_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextNumber = (maxRow?.invoice_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      clinic_id: profile.clinic_id,
      patient_id: input.patientId,
      practitioner_id: profile.id,
      invoice_number: nextNumber,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't create invoice: ${error.message}`);

  if (input.defaultServiceItemId) {
    await addInvoiceLine(data.id, {
      serviceItemId: input.defaultServiceItemId,
      appointmentId: input.appointmentId ?? null,
      quantity: 1,
    });
  }
  return data.id;
}

export async function addInvoiceLine(
  invoiceId: string,
  input: {
    serviceItemId: string;
    appointmentId?: string | null;
    quantity: number;
    unitPriceCentsOverride?: number | null;
  }
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const item = await getServiceItem(input.serviceItemId);
  if (!item) throw new Error("Billable item not found.");
  const clinic = await getClinic();

  const unitPrice = input.unitPriceCentsOverride ?? item.priceCents;
  const gst = item.gstApplies
    ? Math.round(input.quantity * unitPrice * clinic.gstRate)
    : 0;

  const supabase = await createClient();
  const { error } = await supabase.from("invoice_lines").insert({
    clinic_id: profile.clinic_id,
    invoice_id: invoiceId,
    service_item_id: item.id,
    appointment_id: input.appointmentId ?? null,
    description: item.name,
    code: item.code || null,
    quantity: input.quantity,
    unit_price_cents: unitPrice,
    gst_cents: gst,
  });
  if (error) throw new Error(`Couldn't add line: ${error.message}`);
  await recomputeTotals(invoiceId);
}

export async function removeInvoiceLine(
  invoiceId: string,
  lineId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoice_lines")
    .delete()
    .eq("id", lineId)
    .eq("invoice_id", invoiceId);
  if (error) throw new Error(`Couldn't remove line: ${error.message}`);
  await recomputeTotals(invoiceId);
}

export async function issueInvoice(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "issued", issued_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw new Error(`Couldn't issue invoice: ${error.message}`);
}

export async function voidInvoice(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "void" })
    .eq("id", id);
  if (error) throw new Error(`Couldn't void invoice: ${error.message}`);
}

export async function recordPayment(
  invoiceId: string,
  input: { amountCents: number; paymentTypeId: string; reference: string | null }
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  if (input.amountCents <= 0) throw new Error("Payment amount must be positive.");
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    clinic_id: profile.clinic_id,
    invoice_id: invoiceId,
    amount_cents: input.amountCents,
    payment_type_id: input.paymentTypeId,
    reference: input.reference,
  });
  if (error) throw new Error(`Couldn't record payment: ${error.message}`);

  // Mark paid once the balance reaches zero.
  const invoice = await getInvoice(invoiceId);
  if (
    invoice &&
    invoice.status === "issued" &&
    (invoice.paidCents ?? 0) >= invoice.totalCents
  ) {
    await supabase.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
  }
}

export interface BillingSummary {
  outstandingCents: number;
  outstandingCount: number;
  paidThisMonthCents: number;
}

export async function getBillingSummary(): Promise<BillingSummary> {
  const invoices = await listInvoices();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let outstandingCents = 0;
  let outstandingCount = 0;
  const supabase = await createClient();
  const { data: monthPayments } = await supabase
    .from("payments")
    .select("amount_cents")
    .gte("paid_at", monthStart.toISOString());
  const paidThisMonthCents = (monthPayments ?? []).reduce(
    (s, p) => s + p.amount_cents,
    0
  );
  for (const inv of invoices) {
    if (inv.status === "issued") {
      outstandingCents += inv.totalCents - (inv.paidCents ?? 0);
      outstandingCount += 1;
    }
  }
  return { outstandingCents, outstandingCount, paidThisMonthCents };
}
