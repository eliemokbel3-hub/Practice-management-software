// Timezone helpers built on Intl (no library needed). The clinic's timezone
// (e.g. Australia/Melbourne) drives everything the patient sees; instants are
// stored in UTC. Handles daylight saving because Intl knows the tz database.

/** Minutes ahead of UTC that `timeZone` is at the instant `at`. */
export function tzOffsetMinutes(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** The UTC instant of a wall-clock time (y, m 1-12, d, hh:mm) in `timeZone`. */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  // Guess, then correct — twice, to converge across DST transitions.
  let guess = new Date(wall);
  for (let i = 0; i < 2; i++) {
    guess = new Date(wall - tzOffsetMinutes(timeZone, guess) * 60_000);
  }
  return guess;
}

/** "YYYY-MM-DD" of an instant, as seen in `timeZone`. */
export function dateKeyInTz(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** e.g. "9:30 am" as seen in `timeZone`. */
export function formatTimeInTz(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(at);
}

/** e.g. "Friday 24 July 2026" as seen in `timeZone`. */
export function formatLongDateInTz(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(at);
}
