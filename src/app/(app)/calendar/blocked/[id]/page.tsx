import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { dateKey, formatLongDate, formatTime } from "@/lib/calendar-utils";
import { deleteBlockedTimeAction } from "../../actions";

export default async function BlockedTimePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blocked_times")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const starts = new Date(data.starts_at);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <Link
          href={`/calendar?view=day&date=${dateKey(starts)}`}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Calendar
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          {data.reason ?? "Blocked time"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {formatLongDate(starts)} · {formatTime(data.starts_at)}–
          {formatTime(data.ends_at)}
        </p>
      </div>
      <form action={deleteBlockedTimeAction.bind(null, id)}>
        <button className="flex items-center gap-1.5 rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft">
          <Trash2 size={15} /> Remove this block
        </button>
      </form>
    </div>
  );
}
