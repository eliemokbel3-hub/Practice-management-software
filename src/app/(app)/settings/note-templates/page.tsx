import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listNoteTemplates } from "@/lib/data/note-templates";

export default async function NoteTemplatesPage() {
  const templates = await listNoteTemplates();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          Treatment note templates
        </h1>
        <p className="mt-1 text-sm text-muted">
          The structure your notes follow. A template editor is coming — for
          now, tell Claude what to change and it&apos;ll be updated for you.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {templates.map((t) => (
          <details
            key={t.id}
            className="group card"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4">
              <span className="font-medium">
                {t.name}
                {t.isDefault && (
                  <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-soft-foreground">
                    Default
                  </span>
                )}
              </span>
              <span className="text-xs text-faint">
                {t.sections.length} sections ·{" "}
                {t.sections.reduce((n, s) => n + s.questions.length, 0)}{" "}
                questions
              </span>
            </summary>
            <div className="flex flex-col gap-4 border-t border-border px-5 py-4">
              {t.sections.map((s) => (
                <div key={s.key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                    {s.label}
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-sm text-muted">
                    {s.questions.map((q) => (
                      <li key={q.key}>
                        {q.label}
                        <span className="ml-2 text-xs text-faint">
                          {q.type}
                          {q.prefill ? " · pre-filled prompts" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
