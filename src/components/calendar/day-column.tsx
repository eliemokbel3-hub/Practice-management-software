import Link from "next/link";
import { SlotButton } from "@/components/calendar/booking-dialog";
import type { Appointment, BlockedTime, WorkingHours } from "@/lib/types";
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  PX_PER_MINUTE,
  dateKey,
  formatTime,
  layoutOverlaps,
  minutesIntoDay,
} from "@/lib/calendar-utils";

const GRID_START = DAY_START_HOUR * 60;
const GRID_END = DAY_END_HOUR * 60;
const GRID_HEIGHT = (GRID_END - GRID_START) * PX_PER_MINUTE;

function top(minutes: number): number {
  return (Math.max(minutes, GRID_START) - GRID_START) * PX_PER_MINUTE;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const STATUS_DECOR: Record<string, string> = {
  arrived: "ring-2 ring-primary",
  completed: "opacity-60 saturate-50",
  did_not_arrive: "opacity-45 line-through",
};

export function DayColumn({
  day,
  appointments,
  blockedTimes,
  workingHours,
  isToday,
}: {
  day: Date;
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  workingHours: WorkingHours[];
  isToday: boolean;
}) {
  const hoursToday = workingHours.filter((h) => h.weekday === day.getDay());
  const laidOut = layoutOverlaps(
    appointments.filter((a) => a.status !== "cancelled")
  );

  // Non-working shading: everything outside each working window.
  const shades: { from: number; to: number }[] = [];
  if (hoursToday.length === 0) {
    shades.push({ from: GRID_START, to: GRID_END });
  } else {
    let cursor = GRID_START;
    for (const h of [...hoursToday].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    )) {
      const s = timeToMinutes(h.startTime);
      const e = timeToMinutes(h.endTime);
      if (s > cursor) shades.push({ from: cursor, to: s });
      cursor = Math.max(cursor, e);
    }
    if (cursor < GRID_END) shades.push({ from: cursor, to: GRID_END });
  }

  // 30-minute booking slots underneath everything else.
  const slots: number[] = [];
  for (let m = GRID_START; m < GRID_END; m += 30) slots.push(m);

  const slotTime = (minutes: number) => {
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  return (
    <div
      className={`relative border-l border-border ${
        isToday ? "bg-primary-soft/20" : ""
      }`}
      style={{ height: GRID_HEIGHT }}
    >
      {slots.map((m) => (
        <SlotButton
          key={m}
          date={dateKey(day)}
          time={slotTime(m)}
          style={{ top: top(m), height: 30 * PX_PER_MINUTE }}
        />
      ))}

      {shades.map((s, i) => (
        <div
          key={i}
          className="pointer-events-none absolute inset-x-0 bg-foreground/[0.045]"
          style={{ top: top(s.from), height: (s.to - s.from) * PX_PER_MINUTE }}
        />
      ))}

      {blockedTimes.map((b) => {
        const from = minutesIntoDay(b.startsAt);
        const to = minutesIntoDay(b.endsAt);
        return (
          <Link
            key={b.id}
            href={`/calendar/blocked/${b.id}`}
            className="absolute inset-x-0.5 z-10 overflow-hidden rounded-md border border-border-strong bg-surface-hover px-1.5 py-0.5 text-xs text-muted"
            style={{
              top: top(from),
              height: Math.max((to - from) * PX_PER_MINUTE - 2, 14),
              backgroundImage:
                "repeating-linear-gradient(-45deg, transparent, transparent 5px, var(--border) 5px, var(--border) 6px)",
            }}
          >
            {b.reason ?? "Blocked"}
          </Link>
        );
      })}

      {laidOut.map((a) => {
        const from = minutesIntoDay(a.startsAt);
        const to = minutesIntoDay(a.endsAt);
        const widthPct = 100 / a.colCount;
        return (
          <Link
            key={a.id}
            href={`/calendar/appointments/${a.id}`}
            className={`absolute z-20 overflow-hidden rounded-md border border-black/10 px-1.5 py-0.5 text-xs leading-tight text-black/80 shadow-sm transition-transform hover:z-30 ${
              STATUS_DECOR[a.status] ?? ""
            }`}
            style={{
              top: top(from),
              height: Math.max((to - from) * PX_PER_MINUTE - 2, 14),
              left: `calc(${a.col * widthPct}% + 2px)`,
              width: `calc(${widthPct}% - 4px)`,
              backgroundColor: a.typeColor ?? "#7edcd2",
            }}
          >
            <span className="font-semibold">{a.patientName}</span>
            <br />
            {formatTime(a.startsAt)} · {a.typeName}
          </Link>
        );
      })}
    </div>
  );
}
