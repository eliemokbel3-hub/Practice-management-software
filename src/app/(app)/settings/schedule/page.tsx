import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listWorkingHours } from "@/lib/data/schedule";
import { saveScheduleAction } from "./actions";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Show the week Monday-first, like a diary.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function SchedulePage() {
  const hours = await listWorkingHours();
  const byDay = new Map(hours.map((h) => [h.weekday, h]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Working hours</h1>
        <p className="mt-1 text-sm text-muted">
          Tick the days you work and set your hours. The calendar shades
          everything else as unavailable.
        </p>
      </div>

      <form action={saveScheduleAction} className="flex flex-col gap-5">
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {ORDER.map((weekday) => {
            const day = byDay.get(weekday);
            return (
              <div
                key={weekday}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5"
              >
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    name={`enabled-${weekday}`}
                    defaultChecked={!!day}
                    className="accent-primary"
                  />
                  {DAYS[weekday]}
                </label>
                <input
                  type="time"
                  name={`start-${weekday}`}
                  defaultValue={day?.startTime?.slice(0, 5) ?? "09:00"}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-ring"
                />
                <input
                  type="time"
                  name={`end-${weekday}`}
                  defaultValue={day?.endTime?.slice(0, 5) ?? "17:00"}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-ring"
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Save working hours
          </button>
        </div>
      </form>
    </div>
  );
}
