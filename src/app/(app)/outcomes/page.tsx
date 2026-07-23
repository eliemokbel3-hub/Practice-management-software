import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { listMeasures, listRecentResponses } from "@/lib/data/outcomes";
import { formatLongDate } from "@/lib/calendar-utils";

export default async function OutcomesPage() {
  const [measures, recent] = await Promise.all([
    listMeasures(),
    listRecentResponses(20),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Outcome measures</h1>
        <p className="mt-1 text-sm text-muted">
          Send questionnaires from a patient&apos;s file — they fill them in by
          link, scores land back here automatically.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
          Recent responses
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-faint">
            No responses yet. Open a patient&apos;s file and send them a
            questionnaire to get started.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recent.map((r) => (
              <li key={r.requestId} className="py-2 first:pt-0 last:pb-0">
                <Link
                  href={`/patients/${r.patientId}`}
                  className="flex items-center justify-between gap-3 text-sm hover:underline"
                >
                  <span>
                    {r.patientName} · {r.measureName.split(" (")[0]} ·{" "}
                    {formatLongDate(new Date(r.completedAt))}
                  </span>
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-soft-foreground">
                    {r.display}
                    {r.band ? ` · ${r.band}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
          Questionnaire library
        </h2>
        <ul className="flex flex-col divide-y divide-border">
          {measures.map((m) => (
            <li key={m.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
                <ClipboardList size={15} />
              </span>
              <div>
                <p className="text-sm font-medium">{m.name}</p>
                {m.description && (
                  <p className="mt-0.5 text-sm text-muted">{m.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
