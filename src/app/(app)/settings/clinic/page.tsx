import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClinic } from "@/lib/data/clinic";
import { updateClinicAction } from "./actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

function Field({
  label,
  name,
  value,
  hint,
  type = "text",
  step,
}: {
  label: string;
  name: string;
  value: string;
  hint?: string;
  type?: string;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        defaultValue={value}
        className={inputCls}
      />
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

export default async function ClinicSettingsPage() {
  const clinic = await getClinic();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Clinic details</h1>
        <p className="mt-1 text-sm text-muted">
          Shown on invoices and receipts.
        </p>
      </div>

      <form action={updateClinicAction} className="flex flex-col gap-5">
        <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Clinic name" name="name" value={clinic.name} />
          </div>
          <Field label="Phone" name="phone" value={clinic.phone ?? ""} />
          <Field label="Email" name="email" value={clinic.email ?? ""} />
          <div className="sm:col-span-2">
            <Field
              label="ABN / business number"
              name="abn"
              value={clinic.abn ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="Street address" name="address" value={clinic.address ?? ""} />
          </div>
          <Field label="Suburb" name="suburb" value={clinic.suburb ?? ""} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="State" name="state" value={clinic.state ?? ""} />
            <Field label="Postcode" name="postcode" value={clinic.postcode ?? ""} />
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
          <Field
            label="GST rate (%)"
            name="gstRatePercent"
            type="number"
            step="0.1"
            value={(clinic.gstRate * 100).toFixed(1)}
            hint="Applied to billable items marked as attracting GST."
          />
          <Field
            label="Invoice title"
            name="invoiceTitle"
            value={clinic.invoiceTitle}
            hint="Printed at the top of invoices, e.g. Tax Invoice."
          />
        </section>

        <div className="flex justify-end">
          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
            Save clinic details
          </button>
        </div>
      </form>
    </div>
  );
}
