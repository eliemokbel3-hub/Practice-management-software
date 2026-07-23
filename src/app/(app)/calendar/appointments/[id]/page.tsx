import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText, Receipt, UserCheck, UserX, XCircle } from "lucide-react";
import { getAppointment } from "@/lib/data/appointments";
import { getAppointmentType } from "@/lib/data/appointment-types";
import { getNoteForAppointment } from "@/lib/data/clinical-notes";
import { openNoteForAppointmentAction } from "@/app/(app)/notes/actions";
import { createInvoiceForAppointmentAction } from "@/app/(app)/invoices/actions";
import { dateKey, formatLongDate, formatTime } from "@/lib/calendar-utils";
import {
  cancelAppointmentAction,
  rescheduleAppointmentAction,
  setStatusAction,
} from "../../actions";

const inputCls =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring";

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  arrived: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
  did_not_arrive: "Did not arrive",
};

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appointment = await getAppointment(id);
  if (!appointment) notFound();
  const type = appointment.appointmentTypeId
    ? await getAppointmentType(appointment.appointmentTypeId)
    : null;
  const note = await getNoteForAppointment(appointment.id);
  const starts = new Date(appointment.startsAt);
  const durationMinutes = Math.round(
    (new Date(appointment.endsAt).getTime() - starts.getTime()) / 60_000
  );

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href={`/calendar?view=day&date=${dateKey(starts)}`}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Calendar
        </Link>
        <h1 className="flex items-center gap-3 text-xl font-semibold tracking-tight">
          <span
            className="h-4 w-4 rounded"
            style={{ backgroundColor: appointment.typeColor ?? "#7edcd2" }}
          />
          {appointment.typeName ?? "Appointment"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {formatLongDate(starts)} · {formatTime(appointment.startsAt)}–
          {formatTime(appointment.endsAt)} ({durationMinutes} min)
        </p>
      </div>

      <section className="flex flex-col gap-3 card p-5">
        <div className="flex items-center justify-between">
          <Link
            href={`/patients/${appointment.patientId}`}
            className="font-medium text-primary hover:underline"
          >
            {appointment.patientName}
          </Link>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
            {STATUS_LABEL[appointment.status]}
          </span>
        </div>
        {appointment.adminNotes && (
          <p className="text-sm text-muted">{appointment.adminNotes}</p>
        )}
        {appointment.bookedOnline && (
          <p className="text-xs text-faint">Booked online by the patient.</p>
        )}
        {appointment.recurrenceGroup && (
          <p className="text-xs text-faint">Part of a repeating series.</p>
        )}
        {appointment.status === "cancelled" && appointment.cancellationReason && (
          <p className="text-sm text-danger">
            Cancelled: {appointment.cancellationReason}
          </p>
        )}
      </section>

      {appointment.status !== "cancelled" && (
        <>
          <section className="flex items-center justify-between gap-3 card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
              Treatment note
            </h2>
            {note ? (
              <Link
                href={`/notes/${note.id}`}
                className="flex items-center gap-2 btn-secondary"
              >
                <FileText size={15} />
                {note.status === "draft" ? "Continue draft note" : "View note"}
              </Link>
            ) : (
              <form action={openNoteForAppointmentAction.bind(null, appointment.id)}>
                <button className="flex items-center gap-2 btn-primary">
                  <FileText size={15} /> Write treatment note
                </button>
              </form>
            )}
          </section>

          <section className="flex items-center justify-between gap-3 card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
              Billing
            </h2>
            <form action={createInvoiceForAppointmentAction.bind(null, appointment.id)}>
              <button className="flex items-center gap-2 btn-secondary">
                <Receipt size={15} /> Create invoice
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-3 card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
              On the day
            </h2>
            <div className="flex flex-wrap gap-2">
              <form action={setStatusAction.bind(null, appointment.id, "arrived")}>
                <button className="flex items-center gap-1.5 btn-secondary px-3">
                  <UserCheck size={15} /> Arrived
                </button>
              </form>
              <form
                action={setStatusAction.bind(null, appointment.id, "completed")}
              >
                <button className="flex items-center gap-1.5 btn-secondary px-3">
                  <Check size={15} /> Completed
                </button>
              </form>
              <form
                action={setStatusAction.bind(
                  null,
                  appointment.id,
                  "did_not_arrive"
                )}
              >
                <button className="flex items-center gap-1.5 btn-secondary px-3">
                  <UserX size={15} /> Did not arrive
                </button>
              </form>
              {appointment.status !== "booked" && (
                <form action={setStatusAction.bind(null, appointment.id, "booked")}>
                  <button className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover">
                    Reset to booked
                  </button>
                </form>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3 card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
              Reschedule
            </h2>
            <form
              action={rescheduleAppointmentAction.bind(
                null,
                appointment.id,
                durationMinutes
              )}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="date" className="text-sm font-medium">
                  New date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={dateKey(starts)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="time" className="text-sm font-medium">
                  New time
                </label>
                <input
                  id="time"
                  name="time"
                  type="time"
                  required
                  step={300}
                  defaultValue={`${String(starts.getHours()).padStart(2, "0")}:${String(starts.getMinutes()).padStart(2, "0")}`}
                  className={inputCls}
                />
              </div>
              <button className="btn-primary">
                Move appointment
              </button>
            </form>
            {type && durationMinutes !== type.durationMinutes && (
              <p className="text-xs text-faint">
                Keeps the current {durationMinutes}-minute length.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3 card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
              Cancel
            </h2>
            <form
              action={cancelAppointmentAction.bind(null, appointment.id)}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex min-w-64 flex-1 flex-col gap-1.5">
                <label htmlFor="reason" className="text-sm font-medium">
                  Reason
                </label>
                <input
                  id="reason"
                  name="reason"
                  placeholder="e.g. patient unwell, clinic closed"
                  className={inputCls}
                />
              </div>
              <button className="flex items-center gap-1.5 rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft">
                <XCircle size={15} /> Cancel appointment
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
