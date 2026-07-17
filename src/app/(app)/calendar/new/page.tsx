import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listPatients } from "@/lib/data/patients";
import { listAppointmentTypes } from "@/lib/data/appointment-types";
import { formatPrice } from "@/lib/types";
import { createAppointmentAction } from "../actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string }>;
}) {
  const { date, time } = await searchParams;
  const [patients, types] = await Promise.all([
    listPatients(),
    listAppointmentTypes(),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/calendar"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Calendar
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">New appointment</h1>
      </div>

      <form
        action={createAppointmentAction}
        className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="patientId" className="text-sm font-medium">
            Patient *
          </label>
          <select id="patientId" name="patientId" required className={inputCls}>
            <option value="">Choose a patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.lastName}, {p.firstName}
                {p.dateOfBirth ? ` (${p.dateOfBirth.slice(0, 4)})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-faint">
            Someone new?{" "}
            <Link href="/patients/new" className="text-primary hover:underline">
              Create their patient file first.
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="appointmentTypeId" className="text-sm font-medium">
            Appointment type *
          </label>
          <select
            id="appointmentTypeId"
            name="appointmentTypeId"
            required
            className={inputCls}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.durationMinutes} min · {formatPrice(t.priceCents)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-sm font-medium">
              Date *
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={date ?? today}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="time" className="text-sm font-medium">
              Time *
            </label>
            <input
              id="time"
              name="time"
              type="time"
              required
              defaultValue={time ?? "09:00"}
              step={300}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="repeat" className="text-sm font-medium">
              Repeats
            </label>
            <select id="repeat" name="repeat" className={inputCls}>
              <option value="none">Doesn&apos;t repeat</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="repeatCount" className="text-sm font-medium">
              Total visits (if repeating)
            </label>
            <input
              id="repeatCount"
              name="repeatCount"
              type="number"
              min={1}
              max={52}
              defaultValue={6}
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="adminNotes" className="text-sm font-medium">
            Booking note
          </label>
          <input
            id="adminNotes"
            name="adminNotes"
            placeholder="e.g. prefers firm pressure, running 10 min late"
            className={inputCls}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Book appointment
          </button>
        </div>
      </form>
    </div>
  );
}
