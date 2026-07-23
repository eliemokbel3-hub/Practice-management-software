import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { listPaymentTypes } from "@/lib/data/payment-types";
import {
  createPaymentTypeAction,
  setPaymentTypeActiveAction,
} from "./actions";

export default async function PaymentTypesPage() {
  const types = await listPaymentTypes({ includeInactive: true });

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Payment types</h1>
        <p className="mt-1 text-sm text-muted">
          The ways patients pay you — shown when recording a payment.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border card">
        {types.map((t) => (
          <li
            key={t.id}
            className={`flex items-center justify-between px-5 py-3 ${
              t.isActive ? "" : "opacity-50"
            }`}
          >
            <span className="text-sm font-medium">{t.name}</span>
            <form action={setPaymentTypeActiveAction.bind(null, t.id, !t.isActive)}>
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover">
                {t.isActive ? "Archive" : "Restore"}
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={createPaymentTypeAction} className="flex items-center gap-2">
        <input
          name="name"
          required
          placeholder="e.g. Bank transfer"
          className="flex-1 input-base"
        />
        <button className="flex items-center gap-1.5 btn-primary">
          <Plus size={15} /> Add
        </button>
      </form>
    </div>
  );
}
