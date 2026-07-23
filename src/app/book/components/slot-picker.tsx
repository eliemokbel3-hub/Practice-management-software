"use client";

// A week of available times for one appointment type, with back/forward
// paging. Used by the booking flow and by reschedule-from-email.

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { DayAvailability, Slot } from "@/lib/booking/availability";
import { fetchSlotsAction } from "../actions";

/** "YYYY-MM-DD" for today in the clinic's timezone. */
export function todayKey(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

function dayLabel(dateKey: string): { weekday: string; date: string } {
  const [y, m, d] = dateKey.split("-").map(Number);
  const at = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: new Intl.DateTimeFormat("en-AU", {
      timeZone: "UTC",
      weekday: "short",
    }).format(at),
    date: new Intl.DateTimeFormat("en-AU", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
    }).format(at),
  };
}

export function timeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export default function SlotPicker({
  slug,
  appointmentTypeId,
  timeZone,
  onPick,
}: {
  slug: string;
  appointmentTypeId: string;
  timeZone: string;
  onPick: (slot: Slot) => void;
}) {
  const start = useMemo(() => todayKey(timeZone), [timeZone]);
  const [fromDate, setFromDate] = useState(start);
  const [loaded, setLoaded] = useState<{
    forDate: string;
    days: DayAvailability[] | null;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    let stale = false;
    (async () => {
      try {
        const result = await fetchSlotsAction(slug, appointmentTypeId, fromDate);
        if (!stale) {
          setLoaded({
            forDate: fromDate,
            days: result?.days ?? null,
            failed: !result,
          });
        }
      } catch {
        if (!stale) setLoaded({ forDate: fromDate, days: null, failed: true });
      }
    })();
    return () => {
      stale = true;
    };
  }, [slug, appointmentTypeId, fromDate]);

  const loading = loaded?.forDate !== fromDate;
  const failed = !loading && loaded !== null && loaded.failed;
  const days = loading ? null : loaded?.days;
  const hasAny = (days ?? []).some((d) => d.slots.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setFromDate((f) => (f === start ? f : addDays(f, -7)))}
          disabled={fromDate === start || loading}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover disabled:opacity-40"
        >
          <ChevronLeft size={15} /> Earlier
        </button>
        <span className="text-sm font-medium text-muted">
          {dayLabel(fromDate).date} – {dayLabel(addDays(fromDate, 6)).date}
        </span>
        <button
          type="button"
          onClick={() => setFromDate((f) => addDays(f, 7))}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover disabled:opacity-40"
        >
          Later <ChevronRight size={15} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> Finding available times…
        </div>
      )}

      {!loading && failed && (
        <p className="py-6 text-center text-sm text-danger">
          Couldn&apos;t load available times — please refresh and try again.
        </p>
      )}

      {!loading && !failed && !hasAny && (
        <p className="py-6 text-center text-sm text-muted">
          No times available this week — try{" "}
          <button
            type="button"
            onClick={() => setFromDate((f) => addDays(f, 7))}
            className="font-medium text-primary hover:underline"
          >
            the following week
          </button>
          .
        </p>
      )}

      {!loading && !failed && hasAny && (
        <div className="flex flex-col gap-3">
          {(days ?? [])
            .filter((d) => d.slots.length > 0)
            .map((day) => {
              const label = dayLabel(day.date);
              return (
                <div
                  key={day.date}
                  className="card p-4"
                >
                  <p className="mb-3 text-sm font-semibold">
                    {label.weekday}{" "}
                    <span className="font-normal text-muted">{label.date}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {day.slots.map((slot) => (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => onPick(slot)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                      >
                        {timeLabel(slot.startsAt, timeZone)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
