import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImportForm } from "./import-form";

export default function DataImportsPage() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Data imports</h1>
        <p className="mt-1 text-sm text-muted">
          Bring patients in from a spreadsheet. Export patients from your old
          system as CSV, then upload it here.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        <p className="font-medium text-foreground">Expected columns</p>
        <p className="mt-1">
          A header row with any of:{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5 text-xs">
            first_name
          </code>
          ,{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5 text-xs">
            last_name
          </code>
          ,{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5 text-xs">email</code>
          ,{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5 text-xs">phone</code>
          ,{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5 text-xs">
            date_of_birth
          </code>{" "}
          (YYYY-MM-DD). First and last name are required.
        </p>
      </div>

      <ImportForm />

      <p className="text-xs text-faint">
        A full Cliniko migration (appointments, notes, invoices) is a larger,
        deliberate step planned for go-live. This handles patient lists now.
      </p>
    </div>
  );
}
