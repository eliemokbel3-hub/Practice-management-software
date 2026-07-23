import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { listAppointmentTypes } from "@/lib/data/appointment-types";
import { formatPrice } from "@/lib/types";
import { setTypeActiveAction } from "./actions";

export default async function AppointmentTypesPage() {
  const types = await listAppointmentTypes({ includeInactive: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/settings"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={14} /> Settings
          </Link>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
            Appointment types
          </h1>
        </div>
        <Link
          href="/settings/appointment-types/new"
          className="flex items-center gap-2 btn-primary"
        >
          <Plus size={16} /> New type
        </Link>
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Online</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr
                key={t.id}
                className={`border-b border-border last:border-0 ${
                  t.isActive ? "" : "opacity-50"
                }`}
              >
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded"
                      style={{ backgroundColor: t.color }}
                    />
                    <Link
                      href={`/settings/appointment-types/${t.id}/edit`}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.name}
                    </Link>
                    {!t.isActive && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-faint">
                        Archived
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{t.durationMinutes} min</td>
                <td className="px-4 py-3 text-muted">{formatPrice(t.priceCents)}</td>
                <td className="px-4 py-3 text-muted">
                  {t.bookableOnline ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={setTypeActiveAction.bind(null, t.id, !t.isActive)}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
                    >
                      {t.isActive ? "Archive" : "Restore"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  No appointment types yet — create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
