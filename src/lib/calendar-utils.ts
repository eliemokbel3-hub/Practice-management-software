// Date helpers for the diary. All work in server-local time, which matches
// the clinic's timezone while the app runs on Elie's machine / AU-hosted server.

export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 20;
export const PX_PER_MINUTE = 64 / 60; // one hour = 64px

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string | undefined): Date {
  if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Monday of the week containing d. */
export function startOfWeek(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - shift);
  return copy;
}

export function minutesIntoDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDayHeading(d: Date): string {
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

/**
 * Assign side-by-side columns to overlapping items so double bookings render
 * next to each other instead of on top of each other.
 */
export function layoutOverlaps<T extends { startsAt: string; endsAt: string }>(
  items: T[]
): (T & { col: number; colCount: number })[] {
  const sorted = [...items].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const result: (T & { col: number; colCount: number })[] = [];
  let cluster: (T & { col: number; colCount: number })[] = [];
  let clusterEnd = 0;
  const colEnds: number[] = [];

  const flush = () => {
    const count = colEnds.length;
    cluster.forEach((item) => (item.colCount = count));
    result.push(...cluster);
    cluster = [];
    colEnds.length = 0;
  };

  for (const item of sorted) {
    const start = new Date(item.startsAt).getTime();
    const end = new Date(item.endsAt).getTime();
    if (cluster.length > 0 && start >= clusterEnd) flush();
    let col = colEnds.findIndex((e) => e <= start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(end);
    } else {
      colEnds[col] = end;
    }
    cluster.push({ ...item, col, colCount: 1 });
    clusterEnd = Math.max(clusterEnd, ...colEnds);
  }
  flush();
  return result;
}
