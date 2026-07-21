import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClinic } from "@/lib/data/clinic";
import { saveDocumentsAction } from "./actions";

export default async function DocumentsSettingsPage() {
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
        <h1 className="text-xl font-semibold tracking-tight">
          Documents &amp; printing
        </h1>
        <p className="mt-1 text-sm text-muted">
          How your printed and emailed documents look. Your clinic name, ABN and
          address come from Clinic details.
        </p>
      </div>

      <form action={saveDocumentsAction} className="flex flex-col gap-5">
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invoiceFooter" className="text-sm font-medium">
              Invoice footer
            </label>
            <textarea
              id="invoiceFooter"
              name="invoiceFooter"
              rows={3}
              defaultValue={clinic.invoiceFooter ?? ""}
              placeholder="e.g. Payment due within 14 days. Thank you for choosing our clinic."
              className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring"
            />
            <p className="text-xs text-faint">
              Printed at the bottom of every invoice.
            </p>
          </div>
        </section>

        <div className="flex justify-end">
          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
