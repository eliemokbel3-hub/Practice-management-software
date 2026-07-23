import Link from "next/link";
import { ArrowLeft, Check, Plus, Star, Trash2 } from "lucide-react";
import { listTaxRates } from "@/lib/data/lists";
import {
  createTaxRateAction,
  deleteTaxRateAction,
  makeTaxDefaultAction,
  toggleTaxRateAction,
} from "./actions";

export default async function TaxesPage() {
  const rates = await listTaxRates(true);

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Taxes</h1>
        <p className="mt-1 text-sm text-muted">
          Tax rates for invoicing. The default rate is applied to billable items
          marked as attracting GST.
        </p>
      </div>

      {rates.length > 0 && (
        <ul className="flex flex-col divide-y divide-border card">
          {rates.map((r) => (
            <li
              key={r.id}
              className={`flex items-center justify-between gap-3 px-5 py-3 ${
                r.isActive ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{r.name}</span>
                <span className="text-xs text-faint">
                  {(r.rate * 100).toFixed(r.rate * 100 % 1 === 0 ? 0 : 1)}%
                </span>
                {r.isDefault && (
                  <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-soft-foreground">
                    <Check size={10} /> Default
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!r.isDefault && (
                  <form action={makeTaxDefaultAction.bind(null, r.id)}>
                    <button
                      title="Make default"
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
                    >
                      <Star size={12} /> Default
                    </button>
                  </form>
                )}
                <form action={toggleTaxRateAction.bind(null, r.id, !r.isActive)}>
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover">
                    {r.isActive ? "Archive" : "Restore"}
                  </button>
                </form>
                <form action={deleteTaxRateAction.bind(null, r.id)}>
                  <button
                    title="Delete"
                    className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={createTaxRateAction}
        className="flex items-center gap-2 card p-4"
      >
        <input
          name="name"
          required
          placeholder="e.g. GST"
          className="flex-1 input-base"
        />
        <div className="flex items-center gap-1">
          <input
            name="percent"
            type="number"
            step="0.1"
            min={0}
            defaultValue={10}
            className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <span className="text-sm text-muted">%</span>
        </div>
        <button className="flex shrink-0 items-center gap-1.5 btn-primary">
          <Plus size={15} /> Add
        </button>
      </form>
    </div>
  );
}
