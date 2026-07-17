import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, PenLine, Check, X } from "lucide-react";
import { NoteEditor } from "@/components/note-editor";
import { getNote } from "@/lib/data/clinical-notes";
import { formatLongDate, formatTime } from "@/lib/calendar-utils";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();

  const created = new Date(note.createdAt);
  const isDraft = note.status === "draft";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/patients/${note.patientId}`}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={14} /> {note.patientName}
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            Treatment note
          </h1>
          <p className="mt-1 text-sm text-muted">
            {formatLongDate(created)} · {formatTime(note.createdAt)} ·{" "}
            {note.practitionerName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDraft ? (
            <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning-soft-foreground">
              Draft
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
              <Lock size={11} /> Finalised
              {note.finalisedAt &&
                ` ${new Date(note.finalisedAt).toLocaleDateString("en-AU")}`}
            </span>
          )}
          {!isDraft && (
            <Link
              href={`/notes/${note.id}/amend`}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover"
            >
              <PenLine size={14} /> Amend
            </Link>
          )}
        </div>
      </div>

      {(note.revisionCount ?? 0) > 0 && (
        <p className="rounded-lg bg-surface-hover px-3 py-2 text-xs text-muted">
          Amended {note.revisionCount} time{note.revisionCount === 1 ? "" : "s"}{" "}
          since finalising — earlier versions are kept on record.
        </p>
      )}

      {isDraft ? (
        <NoteEditor
          noteId={note.id}
          sections={note.content.sections}
          initialAnswers={note.content.answers}
          mode="draft"
        />
      ) : (
        <div className="flex flex-col gap-5">
          {note.content.sections.map((section) => (
            <section
              key={section.key}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
                {section.label}
              </h2>
              <dl className="flex flex-col gap-4">
                {section.questions.map((q) => {
                  const value = note.content.answers[`${section.key}.${q.key}`];
                  return (
                    <div key={q.key}>
                      <dt className="text-xs uppercase tracking-wide text-faint">
                        {q.label}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed">
                        {q.type === "checkbox" ? (
                          <span className="flex items-start gap-2">
                            {value === true ? (
                              <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                            ) : (
                              <X size={15} className="mt-0.5 shrink-0 text-danger" />
                            )}
                            <span className="text-muted">{q.text}</span>
                          </span>
                        ) : value ? (
                          <span className="whitespace-pre-wrap">{String(value)}</span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
