import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBlockedTimeAction } from "../../actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring";

export default async function NewBlockedTimePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <Link
          href="/calendar"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Calendar
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Block time</h1>
        <p className="mt-1 text-sm text-muted">
          Reserve time you&apos;re not seeing patients — lunch, admin, meetings,
          leave.
        </p>
      </div>

      <form
        action={createBlockedTimeAction}
        className="flex flex-col gap-4 card p-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className="text-sm font-medium">
            Reason
          </label>
          <input
            id="reason"
            name="reason"
            placeholder="e.g. Lunch, Admin, Meeting"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-medium">
            Date *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={date ?? today}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="startTime" className="text-sm font-medium">
              From *
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue="12:00"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="endTime" className="text-sm font-medium">
              To *
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue="12:30"
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary px-5">
            Block time
          </button>
        </div>
      </form>
    </div>
  );
}
