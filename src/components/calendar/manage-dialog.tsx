"use client";

// Managing existing calendar items without leaving the diary: clicking an
// appointment (or a blocked time) opens a popup over the calendar with the
// day-to-day actions — mark arrived/completed, reschedule, cancel, jump to
// the treatment note or invoice. Esc, the X, or clicking outside closes it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  Receipt,
  Trash2,
  UserCheck,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import type { Appointment, AppointmentStatus, BlockedTime } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import type { DialogAppointmentType } from "@/components/calendar/booking-dialog";
import { dateKey, formatLongDate, formatTime } from "@/lib/calendar-utils";
import {
  cancelAppointmentInlineAction,
  changeTypeInlineAction,
  deleteBlockedTimeInlineAction,
  rescheduleAppointmentInlineAction,
  setStatusInlineAction,
} from "@/app/(app)/calendar/actions";
import { openNoteForAppointmentAction } from "@/app/(app)/notes/actions";
import { createInvoiceForAppointmentAction } from "@/app/(app)/invoices/actions";

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  arrived: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
  did_not_arrive: "Did not arrive",
};

const inputCls =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring";
const ghostBtnCls =
  "flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-60";

type Target =
  | { kind: "appointment"; appointment: Appointment }
  | { kind: "blocked"; block: BlockedTime };

const ManageDialogContext = createContext<{
  open: (target: Target) => void;
} | null>(null);

export function ManageDialogProvider({
  types,
  children,
}: {
  types: DialogAppointmentType[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<Target | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback((next: Target) => {
    setTarget(next);
    setError(null);
  }, []);

  const close = useCallback(() => {
    if (!busy) {
      setTarget(null);
      setError(null);
    }
  }, [busy]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, close]);

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>
  ): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      setTarget(null);
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong — please try again.");
    }
  }

  return (
    <ManageDialogContext.Provider value={{ open }}>
      {children}

      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              target.kind === "appointment" ? "Appointment" : "Blocked time"
            }
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl"
          >
            {target.kind === "appointment" ? (
              <AppointmentBody
                appointment={target.appointment}
                types={types}
                busy={busy}
                error={error}
                run={run}
                close={close}
              />
            ) : (
              <BlockedBody
                block={target.block}
                busy={busy}
                error={error}
                run={run}
                close={close}
              />
            )}
          </div>
        </div>
      )}
    </ManageDialogContext.Provider>
  );
}

function AppointmentBody({
  appointment,
  types,
  busy,
  error,
  run,
  close,
}: {
  appointment: Appointment;
  types: DialogAppointmentType[];
  busy: boolean;
  error: string | null;
  run: (a: () => Promise<{ ok: boolean; error?: string }>) => Promise<void>;
  close: () => void;
}) {
  const starts = new Date(appointment.startsAt);
  const durationMinutes = Math.round(
    (new Date(appointment.endsAt).getTime() - starts.getTime()) / 60_000
  );
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const statusBtn = (
    status: AppointmentStatus,
    label: string,
    icon: React.ReactNode
  ) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => run(() => setStatusInlineAction(appointment.id, status))}
      className={`${ghostBtnCls} ${
        appointment.status === status ? "border-primary text-primary" : ""
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2.5 font-semibold">
            <span
              className="h-3.5 w-3.5 rounded"
              style={{ backgroundColor: appointment.typeColor ?? "#7edcd2" }}
            />
            {appointment.typeName ?? "Appointment"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatLongDate(starts)} · {formatTime(appointment.startsAt)}–
            {formatTime(appointment.endsAt)} ({durationMinutes} min)
          </p>
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

      <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-hover px-3.5 py-2.5">
        <Link
          href={`/patients/${appointment.patientId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {appointment.patientName}
        </Link>
        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-soft-foreground">
          {STATUS_LABEL[appointment.status]}
        </span>
      </div>

      {appointment.appointmentTypeId && types.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mng-type" className="text-xs font-medium text-muted">
            Appointment type
          </label>
          <select
            id="mng-type"
            disabled={busy}
            value={appointment.appointmentTypeId}
            onChange={(e) =>
              run(() => changeTypeInlineAction(appointment.id, e.target.value))
            }
            className={`${inputCls} disabled:opacity-60`}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.durationMinutes} min · {formatPrice(t.priceCents)}
              </option>
            ))}
          </select>
          <p className="text-xs text-faint">
            Changing it sets the length to the new type&apos;s usual duration.
          </p>
        </div>
      )}

      {appointment.adminNotes && (
        <p className="text-sm text-muted">{appointment.adminNotes}</p>
      )}
      {(appointment.bookedOnline || appointment.recurrenceGroup) && (
        <p className="text-xs text-faint">
          {[
            appointment.bookedOnline ? "Booked online by the patient." : null,
            appointment.recurrenceGroup ? "Part of a repeating series." : null,
          ]
            .filter(Boolean)
            .join(" ")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {statusBtn("arrived", "Arrived", <UserCheck size={15} />)}
        {statusBtn("completed", "Completed", <Check size={15} />)}
        {statusBtn("did_not_arrive", "Did not arrive", <UserX size={15} />)}
        {appointment.status !== "booked" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => setStatusInlineAction(appointment.id, "booked"))}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            Reset to booked
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          run(() =>
            rescheduleAppointmentInlineAction(
              appointment.id,
              durationMinutes,
              form
            )
          );
        }}
        className="flex flex-wrap items-end gap-2 border-t border-border pt-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mng-date" className="text-xs font-medium text-muted">
            Move to date
          </label>
          <input
            id="mng-date"
            name="date"
            type="date"
            required
            defaultValue={dateKey(starts)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mng-time" className="text-xs font-medium text-muted">
            Time
          </label>
          <input
            id="mng-time"
            name="time"
            type="time"
            required
            step={300}
            defaultValue={`${String(starts.getHours()).padStart(2, "0")}:${String(
              starts.getMinutes()
            ).padStart(2, "0")}`}
            className={inputCls}
          />
        </div>
        <button disabled={busy} className={ghostBtnCls}>
          {busy && <Loader2 size={14} className="animate-spin" />} Move
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <form action={openNoteForAppointmentAction.bind(null, appointment.id)}>
          <button className={ghostBtnCls}>
            <FileText size={15} /> Treatment note
          </button>
        </form>
        <form
          action={createInvoiceForAppointmentAction.bind(null, appointment.id)}
        >
          <button className={ghostBtnCls}>
            <Receipt size={15} /> Invoice
          </button>
        </form>
        <Link
          href={`/calendar/appointments/${appointment.id}`}
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ExternalLink size={13} /> Full details
        </Link>
      </div>

      {showCancel ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-danger/40 p-3">
          <div className="flex min-w-48 flex-1 flex-col gap-1.5">
            <label htmlFor="mng-reason" className="text-xs font-medium text-muted">
              Reason
            </label>
            <input
              id="mng-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. patient unwell"
              className={inputCls}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                cancelAppointmentInlineAction(appointment.id, cancelReason)
              )
            }
            className="flex items-center gap-1.5 rounded-lg bg-danger px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Cancel appointment
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowCancel(false)}
            className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
          >
            Keep it
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => setShowCancel(true)}
          className="flex items-center gap-1.5 self-start rounded-lg border border-danger/40 px-3.5 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60"
        >
          <XCircle size={15} /> Cancel appointment
        </button>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function BlockedBody({
  block,
  busy,
  error,
  run,
  close,
}: {
  block: BlockedTime;
  busy: boolean;
  error: string | null;
  run: (a: () => Promise<{ ok: boolean; error?: string }>) => Promise<void>;
  close: () => void;
}) {
  const starts = new Date(block.startsAt);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{block.reason ?? "Blocked time"}</p>
          <p className="mt-1 text-sm text-muted">
            {formatLongDate(starts)} · {formatTime(block.startsAt)}–
            {formatTime(block.endsAt)}
          </p>
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
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => deleteBlockedTimeInlineAction(block.id))}
        className="flex items-center gap-1.5 self-start rounded-lg border border-danger/40 px-3.5 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60"
      >
        {busy ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Trash2 size={15} />
        )}
        Remove this block
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function useManageDialog() {
  const ctx = useContext(ManageDialogContext);
  if (!ctx) {
    throw new Error("Manage dialog components need ManageDialogProvider.");
  }
  return ctx;
}

/** An appointment block on the diary: click to manage it in the popup. */
export function AppointmentChip({
  appointment,
  className,
  style,
}: {
  appointment: Appointment;
  className: string;
  style: React.CSSProperties;
}) {
  const { open } = useManageDialog();
  return (
    <button
      type="button"
      onClick={() => open({ kind: "appointment", appointment })}
      className={className}
      style={style}
    >
      <span className="font-semibold">{appointment.patientName}</span>
      <br />
      {formatTime(appointment.startsAt)} · {appointment.typeName}
    </button>
  );
}

/** A blocked-time block on the diary: click to manage it in the popup. */
export function BlockedChip({
  block,
  className,
  style,
}: {
  block: BlockedTime;
  className: string;
  style: React.CSSProperties;
}) {
  const { open } = useManageDialog();
  return (
    <button
      type="button"
      onClick={() => open({ kind: "blocked", block })}
      className={className}
      style={style}
    >
      {block.reason ?? "Blocked"}
    </button>
  );
}
