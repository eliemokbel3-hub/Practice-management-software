"use client";

// The questionnaire a patient fills in from their emailed link. Standard
// measures render as one card per question; the PSFS lets the patient name
// up to three activities and rate each 0–10.

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { MeasureDefinition } from "@/lib/outcomes/types";
import { submitMeasureAction } from "../actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

export default function MeasureForm({
  token,
  definition,
  clinicName,
}: {
  token: string;
  definition: MeasureDefinition;
  clinicName: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [activities, setActivities] = useState(
    [0, 1, 2].map(() => ({ name: "", rating: "" }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isPsfs = definition.kind === "psfs";
  const unanswered = isPsfs
    ? 0
    : definition.questions.filter((q) => !(q.key in answers)).length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!isPsfs && unanswered > 0) {
      setError(
        `Please answer the remaining ${unanswered === 1 ? "question" : `${unanswered} questions`} — every section counts towards the score.`
      );
      return;
    }
    const payload = isPsfs
      ? {
          activities: activities
            .filter((a) => a.name.trim() && a.rating !== "")
            .map((a) => ({ name: a.name.trim(), rating: Number(a.rating) })),
        }
      : answers;
    setSubmitting(true);
    const result = await submitMeasureAction(token, payload);
    setSubmitting(false);
    if (result.ok) setDone(true);
    else setError(result.error ?? "Something went wrong — please try again.");
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <CheckCircle2 size={24} />
        </span>
        <h2 className="text-lg font-semibold">Thank you!</h2>
        <p className="text-sm text-muted">
          Your answers have been sent to {clinicName}. You can close this page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-muted">
        {definition.instructions}
      </p>

      {isPsfs ? (
        <div className="flex flex-col gap-3">
          {activities.map((a, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`act-${i}`} className="text-sm font-medium">
                  Activity {i + 1}
                  {i > 0 && (
                    <span className="font-normal text-faint"> (optional)</span>
                  )}
                </label>
                <input
                  id={`act-${i}`}
                  value={a.name}
                  onChange={(e) =>
                    setActivities((prev) =>
                      prev.map((p, j) =>
                        j === i ? { ...p, name: e.target.value } : p
                      )
                    )
                  }
                  placeholder="e.g. Running 5 km, lifting my toddler, gardening"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">
                  How well can you do it today?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 11 }, (_, r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setActivities((prev) =>
                          prev.map((p, j) =>
                            j === i ? { ...p, rating: String(r) } : p
                          )
                        )
                      }
                      className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                        a.rating === String(r)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary hover:text-primary"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-faint">
                  0 = unable to perform · 10 = able to perform as well as before
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {definition.questions.map((q, qi) => (
            <fieldset
              key={q.key}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <legend className="sr-only">{q.text}</legend>
              <p className="mb-3 text-sm font-semibold">
                {qi + 1}. {q.text}
              </p>
              <div className="flex flex-col gap-1">
                {q.options.map((o) => (
                  <label
                    key={o.score}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      answers[q.key] === o.score
                        ? "border-primary bg-primary-soft/40"
                        : "border-transparent hover:bg-surface-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.key}
                      checked={answers[q.key] === o.score}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.key]: o.score }))
                      }
                      className="mt-0.5 accent-[var(--primary)]"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        Send my answers
      </button>
    </form>
  );
}
