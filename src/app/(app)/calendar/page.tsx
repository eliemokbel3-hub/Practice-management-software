import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayColumn } from "@/components/calendar/day-column";
import {
  BlockTimeButton,
  BookingDialogProvider,
  NewAppointmentButton,
} from "@/components/calendar/booking-dialog";
import { ManageDialogProvider } from "@/components/calendar/manage-dialog";
import { listAppointmentsInRange } from "@/lib/data/appointments";
import { listBlockedTimesInRange, listWorkingHours } from "@/lib/data/schedule";
import { listAppointmentTypes } from "@/lib/data/appointment-types";
import { listPatients } from "@/lib/data/patients";
import { listBlockTypes } from "@/lib/data/lists";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  PX_PER_MINUTE,
  addDays,
  dateKey,
  formatDayHeading,
  formatLongDate,
  isSameDay,
  parseDateKey,
  startOfWeek,
} from "@/lib/calendar-utils";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "day" ? "day" : "week";
  const focus = parseDateKey(params.date);
  const rangeStart = view === "week" ? startOfWeek(focus) : focus;
  const dayCount = view === "week" ? 7 : 1;
  const rangeEnd = addDays(rangeStart, dayCount);
  const today = new Date();

  const [appointments, blockedTimes, workingHours, patients, types, blockTypes] =
    await Promise.all([
      listAppointmentsInRange(rangeStart.toISOString(), rangeEnd.toISOString()),
      listBlockedTimesInRange(rangeStart.toISOString(), rangeEnd.toISOString()),
      listWorkingHours(),
      listPatients(),
      listAppointmentTypes(),
      listBlockTypes(),
    ]);
  const dialogPatients = patients.map((p) => ({
    id: p.id,
    label: `${p.lastName}, ${p.firstName}${
      p.dateOfBirth ? ` (${p.dateOfBirth.slice(0, 4)})` : ""
    }`,
  }));
  const dialogTypes = types.map((t) => ({
    id: t.id,
    name: t.name,
    durationMinutes: t.durationMinutes,
    priceCents: t.priceCents,
  }));

  const days = Array.from({ length: dayCount }, (_, i) => addDays(rangeStart, i));
  const step = view === "week" ? 7 : 1;
  const navHref = (offsetDays: number) =>
    `/calendar?view=${view}&date=${dateKey(addDays(focus, offsetDays))}`;
  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, i) => DAY_START_HOUR + i
  );

  return (
    <BookingDialogProvider
      patients={dialogPatients}
      types={dialogTypes}
      blockTypes={blockTypes.map((b) => b.name)}
    >
    <ManageDialogProvider types={dialogTypes}>
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          {view === "week"
            ? `Week of ${formatDayHeading(rangeStart)}`
            : formatLongDate(focus)}
        </h1>
        <div className="flex items-center gap-2">
          <BlockTimeButton date={dateKey(focus)} />
          <NewAppointmentButton date={dateKey(focus)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={navHref(-step)}
            aria-label="Previous"
            className="rounded-lg border border-border p-2 transition-colors hover:bg-surface-hover"
          >
            <ChevronLeft size={15} />
          </Link>
          <Link
            href={`/calendar?view=${view}`}
            className="btn-secondary px-3 py-1.5"
          >
            Today
          </Link>
          <Link
            href={navHref(step)}
            aria-label="Next"
            className="rounded-lg border border-border p-2 transition-colors hover:bg-surface-hover"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 text-sm font-medium">
          {(["day", "week"] as const).map((v) => (
            <Link
              key={v}
              href={`/calendar?view=${v}&date=${dateKey(focus)}`}
              className={`rounded-md px-3 py-1 capitalize transition-colors ${
                view === v
                  ? "bg-primary-soft text-primary-soft-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto card">
        <div className={view === "week" ? "min-w-[640px]" : undefined}>
          <div
            className="grid border-b border-border"
            style={{
              gridTemplateColumns: `56px repeat(${dayCount}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {days.map((d) => (
              <Link
                key={dateKey(d)}
                href={`/calendar?view=day&date=${dateKey(d)}`}
                className={`border-l border-border px-2 py-2 text-center text-sm font-medium ${
                  isSameDay(d, today)
                    ? "text-primary"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {formatDayHeading(d)}
              </Link>
            ))}
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `56px repeat(${dayCount}, minmax(0, 1fr))`,
            }}
          >
            <div className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  className="pr-2 text-right text-xs text-faint"
                  style={{ height: 60 * PX_PER_MINUTE }}
                >
                  <span className="relative -top-1.5">
                    {h > 12 ? `${h - 12}pm` : h === 12 ? "12pm" : `${h}am`}
                  </span>
                </div>
              ))}
            </div>
            {days.map((d) => (
              <DayColumn
                key={dateKey(d)}
                day={d}
                isToday={isSameDay(d, today)}
                appointments={appointments.filter((a) =>
                  isSameDay(new Date(a.startsAt), d)
                )}
                blockedTimes={blockedTimes.filter((b) =>
                  isSameDay(new Date(b.startsAt), d)
                )}
                workingHours={workingHours}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-faint">
        Click an empty slot to book it · click an appointment to manage it ·
        shaded areas are outside your working hours.
      </p>
    </div>
    </ManageDialogProvider>
    </BookingDialogProvider>
  );
}
