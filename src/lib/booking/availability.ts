// Free-slot computation for online bookings: the practitioner's weekly
// working hours, minus existing appointments and blocked time, honouring the
// appointment type's duration and buffers plus the clinic's booking rules.
// Pure functions — all data comes in as arguments, so this is easy to test.

import { zonedToUtc } from "./timezone";

export interface BusyInterval {
  startsAt: string; // ISO UTC
  endsAt: string;
}

export interface Slot {
  startsAt: string; // ISO UTC
  endsAt: string;
  practitionerId: string;
}

export interface DayAvailability {
  /** Calendar date in the clinic's timezone, "YYYY-MM-DD". */
  date: string;
  slots: Slot[];
}

export interface AvailabilityParams {
  timeZone: string;
  /** The practitioner's regular weekly hours (0 = Sunday). */
  workingHours: { weekday: number; startTime: string; endTime: string }[];
  /** Appointments (not cancelled) and blocked times, as UTC intervals. */
  busy: BusyInterval[];
  practitionerId: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  slotIntervalMinutes: number;
  /** First calendar date to offer, "YYYY-MM-DD" in the clinic's timezone. */
  fromDate: string;
  /** Number of calendar days to compute. */
  days: number;
  /** No slot may start before this instant (now + minimum notice). */
  earliestStart: Date;
  /** No slot may start after this instant (booking horizon). */
  latestStart: Date;
}

function parseTimeMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function computeAvailability(params: AvailabilityParams): DayAvailability[] {
  const busy = params.busy
    .map((b) => ({
      start: new Date(b.startsAt).getTime(),
      end: new Date(b.endsAt).getTime(),
    }))
    .filter((b) => b.end > b.start);

  const [fy, fm, fd] = params.fromDate.split("-").map(Number);
  const result: DayAvailability[] = [];

  for (let i = 0; i < params.days; i++) {
    // Date arithmetic on the calendar date triple; Date.UTC normalises
    // overflow (e.g. July 35 → August 4). A calendar date's weekday doesn't
    // depend on timezone, so getUTCDay on the normalised date is correct.
    const cal = new Date(Date.UTC(fy, fm - 1, fd + i));
    const y = cal.getUTCFullYear();
    const m = cal.getUTCMonth() + 1;
    const d = cal.getUTCDate();
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday = cal.getUTCDay();

    const slots: Slot[] = [];
    for (const wh of params.workingHours) {
      if (wh.weekday !== weekday) continue;
      const openMin = parseTimeMinutes(wh.startTime);
      const closeMin = parseTimeMinutes(wh.endTime);

      for (
        let startMin = openMin;
        startMin + params.durationMinutes <= closeMin;
        startMin += params.slotIntervalMinutes
      ) {
        const start = zonedToUtc(
          y, m, d,
          Math.floor(startMin / 60), startMin % 60,
          params.timeZone
        );
        const end = new Date(start.getTime() + params.durationMinutes * 60_000);
        if (start < params.earliestStart || start > params.latestStart) continue;

        // The slot plus its buffers must not touch anything already booked.
        const blockStart = start.getTime() - params.bufferBeforeMinutes * 60_000;
        const blockEnd = end.getTime() + params.bufferAfterMinutes * 60_000;
        const clash = busy.some((b) => blockStart < b.end && blockEnd > b.start);
        if (clash) continue;

        slots.push({
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          practitionerId: params.practitionerId,
        });
      }
    }
    result.push({ date: dateStr, slots });
  }
  return result;
}

/** Merge per-practitioner day lists into one, deduping identical start times. */
export function mergeAvailability(lists: DayAvailability[][]): DayAvailability[] {
  if (lists.length === 0) return [];
  if (lists.length === 1) return lists[0];
  const byDate = new Map<string, Map<string, Slot>>();
  for (const list of lists) {
    for (const day of list) {
      const slots = byDate.get(day.date) ?? new Map<string, Slot>();
      for (const slot of day.slots) {
        if (!slots.has(slot.startsAt)) slots.set(slot.startsAt, slot);
      }
      byDate.set(day.date, slots);
    }
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({
      date,
      slots: [...slots.values()].sort((a, b) =>
        a.startsAt.localeCompare(b.startsAt)
      ),
    }));
}
