import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, Trash2, XCircle } from "lucide-react";
import { getInvoice } from "@/lib/data/invoices";
import { getClinic } from "@/lib/data/clinic";
import { getPatient } from "@/lib/data/patients";
import { listServiceItems } from "@/lib/data/service-items";
import { listPaymentTypes } from "@/lib/data/payment-types";
import { formatPrice } from "@/lib/types";
import { PrintButton } from "@/components/print-button";
import {
  addLineAction,
  issueInvoiceAction,
  recordPaymentAction,
  removeLineAction,
  voidInvoiceAction,
} from "../actions";

const inputCls =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-warning-soft text-warning-soft-foreground",
  issued: "bg-surface-hover text-muted",
  paid: "bg-primary-soft text-primary-soft-foreground",
  void: "bg-danger-soft text-danger",
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const [clinic, patient, serviceItems, paymentTypes] = await Promise.all([
    getClinic(),
    getPatient(invoice.patientId),
    listServiceItems(),
    listPaymentTypes(),
  ]);
  const isDraft = invoice.status === "draft";
  const balance = invoice.totalCents - (invoice.paidCents ?? 0);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link
            href="/invoices"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={14} /> Invoices
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            Invoice #{invoice.invoiceNumber}
            <span
              className={`ml-3 rounded-full px-3 py-1 align-middle text-xs font-medium capitalize ${STATUS_STYLE[invoice.status]}`}
            >
              {invoice.status}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          {isDraft && (invoice.lines?.length ?? 0) > 0 && (
            <form action={issueInvoiceAction.bind(null, invoice.id)}>
              <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
                <Send size={14} /> Issue invoice
              </button>
            </form>
          )}
          {invoice.status !== "void" && invoice.status !== "paid" && (
            <form action={voidInvoiceAction.bind(null, invoice.id)}>
              <button className="flex items-center gap-2 rounded-lg border border-danger/40 px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft">
                <XCircle size={14} /> Void
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Printable document */}
      <section className="rounded-xl border border-border bg-surface p-6 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-6">
          <div>
            {(clinic.logo ?? clinic.logoDark) && (
              // Invoices print on white, so always use the light logo.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clinic.logo ?? clinic.logoDark ?? ""}
                alt={clinic.name}
                className="mb-3 max-h-14 max-w-[200px] object-contain"
              />
            )}
            <h2 className="text-lg font-semibold">{clinic.invoiceTitle}</h2>
            <p className="mt-1 text-sm font-medium">{clinic.name}</p>
            <p className="text-xs leading-relaxed text-muted">
              {[clinic.address, clinic.suburb, clinic.state, clinic.postcode]
                .filter(Boolean)
                .join(", ")}
              {clinic.abn && (
                <>
                  <br />
                  ABN {clinic.abn}
                </>
              )}
              {clinic.phone && (
                <>
                  <br />
                  {clinic.phone}
                </>
              )}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Invoice #{invoice.invoiceNumber}</p>
            <p className="text-muted">
              {invoice.issuedDate
                ? new Date(invoice.issuedDate).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Draft"}
            </p>
            {patient && (
              <p className="mt-3 text-muted">
                <span className="font-medium text-foreground">
                  {patient.firstName} {patient.lastName}
                </span>
                {patient.addressLine1 && (
                  <>
                    <br />
                    {[patient.addressLine1, patient.suburb, patient.state, patient.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
              <th className="py-2 font-medium">Code</th>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">GST</th>
              <th className="py-2 text-right font-medium">Amount</th>
              {isDraft && <th className="print:hidden" />}
            </tr>
          </thead>
          <tbody>
            {(invoice.lines ?? []).map((line) => (
              <tr key={line.id} className="border-b border-border last:border-0">
                <td className="py-2 font-mono text-xs">{line.code ?? "—"}</td>
                <td className="py-2">{line.description}</td>
                <td className="py-2 text-right">{line.quantity}</td>
                <td className="py-2 text-right">
                  {formatPrice(line.unitPriceCents)}
                </td>
                <td className="py-2 text-right">
                  {line.gstCents > 0 ? formatPrice(line.gstCents) : "—"}
                </td>
                <td className="py-2 text-right">
                  {formatPrice(line.quantity * line.unitPriceCents + line.gstCents)}
                </td>
                {isDraft && (
                  <td className="py-2 pl-2 text-right print:hidden">
                    <form action={removeLineAction.bind(null, invoice.id, line.id)}>
                      <button
                        aria-label="Remove line"
                        className="rounded p-1 text-faint hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            {(invoice.lines?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  No items yet — add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-56 text-sm">
          <div className="flex justify-between py-1 text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(invoice.subtotalCents)}</span>
          </div>
          <div className="flex justify-between py-1 text-muted">
            <span>GST</span>
            <span>{formatPrice(invoice.gstCents)}</span>
          </div>
          <div className="flex justify-between border-t border-border py-1.5 font-semibold">
            <span>Total</span>
            <span>{formatPrice(invoice.totalCents)}</span>
          </div>
          {(invoice.paidCents ?? 0) > 0 && (
            <>
              <div className="flex justify-between py-1 text-muted">
                <span>Paid</span>
                <span>{formatPrice(invoice.paidCents ?? 0)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold">
                <span>Balance due</span>
                <span>{formatPrice(Math.max(balance, 0))}</span>
              </div>
            </>
          )}
        </div>

        {(invoice.payments?.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-border pt-3 text-xs text-muted">
            {invoice.payments!.map((p) => (
              <p key={p.id}>
                Payment {formatPrice(p.amountCents)} —{" "}
                {p.paymentTypeName ?? "payment"} on{" "}
                {new Date(p.paidAt).toLocaleDateString("en-AU")}
                {p.reference ? ` (ref ${p.reference})` : ""}
              </p>
            ))}
          </div>
        )}

        {clinic.invoiceFooter && (
          <p className="mt-6 whitespace-pre-wrap border-t border-border pt-3 text-xs text-muted">
            {clinic.invoiceFooter}
          </p>
        )}
      </section>

      {isDraft && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 print:hidden">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
            Add item
          </h2>
          <form
            action={addLineAction.bind(null, invoice.id)}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex min-w-64 flex-1 flex-col gap-1.5">
              <label htmlFor="serviceItemId" className="text-sm font-medium">
                Billable item
              </label>
              <select id="serviceItemId" name="serviceItemId" required className={inputCls}>
                {serviceItems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `(${s.code}) ` : ""}
                    {s.name} — {formatPrice(s.priceCents)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-20 flex-col gap-1.5">
              <label htmlFor="quantity" className="text-sm font-medium">
                Qty
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                className={inputCls}
              />
            </div>
            <div className="flex w-32 flex-col gap-1.5">
              <label htmlFor="priceOverride" className="text-sm font-medium">
                Price override
              </label>
              <input
                id="priceOverride"
                name="priceOverride"
                type="number"
                step="0.01"
                placeholder="Default"
                className={inputCls}
              />
            </div>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
              Add
            </button>
          </form>
        </section>
      )}

      {invoice.status === "issued" && balance > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 print:hidden">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
            Record payment
          </h2>
          <form
            action={recordPaymentAction.bind(null, invoice.id)}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex w-32 flex-col gap-1.5">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount ($)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                defaultValue={(balance / 100).toFixed(2)}
                className={inputCls}
              />
            </div>
            <div className="flex w-44 flex-col gap-1.5">
              <label htmlFor="paymentTypeId" className="text-sm font-medium">
                Payment type
              </label>
              <select id="paymentTypeId" name="paymentTypeId" required className={inputCls}>
                {paymentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1.5">
              <label htmlFor="reference" className="text-sm font-medium">
                Reference
              </label>
              <input id="reference" name="reference" className={inputCls} />
            </div>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
              Record
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
