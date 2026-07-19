"use client";

// In-calendar creation: clicking an empty slot (or the header buttons) opens
// one dialog right over the diary for both appointments and blocked time.
// Everything is editable there — including the date and time, so a mis-click
// is fixed in place — and Esc, the X, or clicking outside closes it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarOff, Loader2, Plus, X } from "lucide-react";
import { formatPrice } from "@/lib/types";
import {
  createAppointmentInlineAction,
  createBlockedTimeInlineAction,
} from "@/app/(app)/calendar/actions";

export interface DialogPatient {
  id: string;
  label: string;
}

export interface DialogAppointmentType {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

type Mode = "appointment" | "block";

interface OpenAt {
  mode: Mode;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
}

const BookingDialogContext = createContext<{
  openAt: (at: OpenAt) => void;
} | null>(null);

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring";

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60
  ).padStart(2, "0")}`;
}

export function BookingDialogProvider({
  patients,
  types,
  children,
}: {
  patients: DialogPatient[];
  types: DialogAppointmentType[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [at, setAt] = useState<OpenAt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAt = useCallback((next: OpenAt) => {
    setAt(next);
    setError(null);
  }, []);

  const close = useCallback(() => {
    if (!submitting) {
      setAt(null);
      setError(null);
    }
  }, [submitting]);

  useEffect(() => {
    if (!at) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, close]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!at) return;
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    const result =
      at.mode === "appointment"
        ? await createAppointmentInlineAction(form)
        : await createBlockedTimeInlineAction(form);
    setSubmitting(false);
    if (result.ok) {
      setAt(null);
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong — please try again.");
    }
  }

  return (
    <BookingDialogContext.Provider value={{ openAt }}>
      {children}

      {at && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={at.mode === "appointment" ? "New appointment" : "Block time"}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 text-sm font-medium">
                {(
                  [
                    ["appointment", "Appointment"],
                    ["block", "Block time"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => openAt({ ...at, mode })}
                    className={`rounded-md px-3 py-1 transition-colors ${
                      at.mode === mode
                        ? "bg-primary-soft text-primary-soft-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {at.mode === "appointment" ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dlg-patient" className="text-sm font-medium">
                    Patient *
                  </label>
                  <select
                    id="dlg-patient"
                    name="patientId"
                    required
                    autoFocus
                    className={inputCls}
                  >
                    <option value="">Choose a patient…</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-faint">
                    Someone new?{" "}
                    <Link
                      href="/patients/new"
                      className="text-primary hover:underline"
                    >
                      Create their patient file first.
                    </Link>
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dlg-type" className="text-sm font-medium">
                    Appointment type *
                  </label>
                  <select
                    id="dlg-type"
                    name="appointmentTypeId"
                    required
                    className={inputCls}
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.durationMinutes} min ·{" "}
                        {formatPrice(t.priceCents)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dlg-date" className="text-sm font-medium">
                      Date *
                    </label>
                    <input
                      id="dlg-date"
                      name="date"
                      type="date"
                      required
                      defaultValue={at.date}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dlg-time" className="text-sm font-medium">
                      Time *
                    </label>
                    <input
                      id="dlg-time"
                      name="time"
                      type="time"
                      required
                      step={300}
                      defaultValue={at.time}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dlg-repeat" className="text-sm font-medium">
                      Repeats
                    </label>
                    <select id="dlg-repeat" name="repeat" className={inputCls}>
                      <option value="none">Doesn&apos;t repeat</option>
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="dlg-repeatCount"
                      className="text-sm font-medium"
                    >
                      Total visits (if repeating)
                    </label>
                    <input
                      id="dlg-repeatCount"
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
                  <label htmlFor="dlg-note" className="text-sm font-medium">
                    Booking note
                  </label>
                  <input
                    id="dlg-note"
                    name="adminNotes"
                    placeholder="e.g. prefers firm pressure, running 10 min late"
                    className={inputCls}
                  />
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    disabled={submitting}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    Book appointment
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <p className="text-sm text-muted">
                  Reserve time you&apos;re not seeing patients — lunch, admin,
                  meetings, leave.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dlg-reason" className="text-sm font-medium">
                    Reason
                  </label>
                  <input
                    id="dlg-reason"
                    name="reason"
                    autoFocus
                    placeholder="e.g. Lunch, Admin, Meeting"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dlg-block-date" className="text-sm font-medium">
                    Date *
                  </label>
                  <input
                    id="dlg-block-date"
                    name="date"
                    type="date"
                    required
                    defaultValue={at.date}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dlg-from" className="text-sm font-medium">
                      From *
                    </label>
                    <input
                      id="dlg-from"
                      name="startTime"
                      type="time"
                      required
                      step={300}
                      defaultValue={at.time}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="dlg-to" className="text-sm font-medium">
                      To *
                    </label>
                    <input
                      id="dlg-to"
                      name="endTime"
                      type="time"
                      required
                      step={300}
                      defaultValue={addMinutes(at.time, 30)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    disabled={submitting}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    Block time
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </BookingDialogContext.Provider>
  );
}

function useBookingDialog() {
  const ctx = useContext(BookingDialogContext);
  if (!ctx) {
    throw new Error("Booking dialog components need BookingDialogProvider.");
  }
  return ctx;
}

/** An empty diary slot: click to open the booking dialog at that time. */
export function SlotButton({
  date,
  time,
  style,
}: {
  date: string;
  time: string;
  style?: React.CSSProperties;
}) {
  const { openAt } = useBookingDialog();
  return (
    <button
      type="button"
      title="Book appointment"
      onClick={() => openAt({ mode: "appointment", date, time })}
      className="absolute inset-x-0 block border-b border-border/40 transition-colors hover:bg-primary-soft/40"
      style={style}
    />
  );
}

/** The calendar header's "New appointment" button. */
export function NewAppointmentButton({ date }: { date: string }) {
  const { openAt } = useBookingDialog();
  return (
    <button
      type="button"
      onClick={() => openAt({ mode: "appointment", date, time: "09:00" })}
      className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
    >
      <Plus size={15} /> New appointment
    </button>
  );
}

/** The calendar header's "Block time" button — same dialog, block tab. */
export function BlockTimeButton({ date }: { date: string }) {
  const { openAt } = useBookingDialog();
  return (
    <button
      type="button"
      onClick={() => openAt({ mode: "block", date, time: "12:00" })}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
    >
      <CalendarOff size={15} /> Block time
    </button>
  );
}
