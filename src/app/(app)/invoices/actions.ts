"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addInvoiceLine,
  createInvoice,
  issueInvoice,
  recordPayment,
  removeInvoiceLine,
  voidInvoice,
} from "@/lib/data/invoices";
import { getAppointment } from "@/lib/data/appointments";
import { getAppointmentType } from "@/lib/data/appointment-types";

export async function createInvoiceForAppointmentAction(appointmentId: string) {
  const appointment = await getAppointment(appointmentId);
  if (!appointment) throw new Error("Appointment not found.");
  const type = appointment.appointmentTypeId
    ? await getAppointmentType(appointment.appointmentTypeId)
    : null;
  const id = await createInvoice({
    patientId: appointment.patientId,
    appointmentId,
    defaultServiceItemId: type?.defaultServiceItemId ?? null,
  });
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function createInvoiceForPatientAction(patientId: string) {
  const id = await createInvoice({ patientId });
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function addLineAction(invoiceId: string, form: FormData) {
  const serviceItemId = String(form.get("serviceItemId") ?? "");
  if (!serviceItemId) throw new Error("Choose a billable item.");
  const quantity = Math.max(1, Number(form.get("quantity")) || 1);
  const priceRaw = String(form.get("priceOverride") ?? "").trim();
  const override = priceRaw === "" ? null : Math.round(Number(priceRaw) * 100);
  await addInvoiceLine(invoiceId, {
    serviceItemId,
    quantity,
    unitPriceCentsOverride: Number.isFinite(override ?? 0) ? override : null,
  });
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function removeLineAction(invoiceId: string, lineId: string) {
  await removeInvoiceLine(invoiceId, lineId);
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function issueInvoiceAction(id: string) {
  await issueInvoice(id);
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function voidInvoiceAction(id: string) {
  await voidInvoice(id);
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function recordPaymentAction(invoiceId: string, form: FormData) {
  const amount = Number(form.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid payment amount.");
  }
  const paymentTypeId = String(form.get("paymentTypeId") ?? "");
  if (!paymentTypeId) throw new Error("Choose a payment type.");
  await recordPayment(invoiceId, {
    amountCents: Math.round(amount * 100),
    paymentTypeId,
    reference: String(form.get("reference") ?? "").trim() || null,
  });
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}
