import Link from "next/link";
import { getBillingSummary, listInvoices } from "@/lib/data/invoices";
import { formatPrice } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-warning-soft text-warning-soft-foreground",
  issued: "bg-surface-hover text-muted",
  paid: "bg-primary-soft text-primary-soft-foreground",
  void: "bg-danger-soft text-danger",
};

const FILTERS = ["all", "draft", "issued", "paid", "void"] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = FILTERS.includes(status as (typeof FILTERS)[number])
    ? status
    : "all";
  const [invoices, summary] = await Promise.all([
    listInvoices(filter === "all" ? undefined : { status: filter }),
    getBillingSummary(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="animate-fade-up text-[26px] font-semibold leading-tight tracking-tight">
        Invoices
      </h1>

      <div className="animate-fade-up-delayed grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="section-label">Outstanding</p>
          <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-tight">
            {formatPrice(summary.outstandingCents)}
          </p>
          <p className="mt-1.5 text-xs text-muted">
            across {summary.outstandingCount} unpaid invoice
            {summary.outstandingCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="card p-5">
          <p className="section-label">Payments this month</p>
          <p
            className="mt-1.5 bg-clip-text text-[28px] font-semibold leading-none tracking-tight text-transparent"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {formatPrice(summary.paidThisMonthCents)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 self-start rounded-xl border border-border bg-surface p-0.5 text-sm font-medium shadow-xs">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/invoices" : `/invoices?status=${f}`}
            className={`rounded-[10px] px-3 py-1 capitalize transition-colors ${
              filter === f
                ? "bg-primary-soft text-primary-soft-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const balance = inv.totalCents - (inv.paidCents ?? 0);
              return (
                <tr
                  key={inv.id}
                  className="border-b border-border last:border-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      #{inv.invoiceNumber}
                    </Link>
                    <span className="ml-2 text-xs text-faint">
                      {new Date(inv.createdAt).toLocaleDateString("en-AU")}
                    </span>
                  </td>
                  <td className="px-4 py-3">{inv.patientName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[inv.status]}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatPrice(inv.totalCents)}</td>
                  <td className="px-4 py-3">
                    {inv.status === "issued" ? formatPrice(balance) : "—"}
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  No invoices yet — create one from an appointment or a patient
                  file.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
