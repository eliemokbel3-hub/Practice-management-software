"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, CloudUpload, Lock } from "lucide-react";
import type { NoteSection } from "@/lib/types";
import {
  amendNoteAction,
  finaliseNoteAction,
  saveDraftAction,
} from "@/app/(app)/notes/actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

export function NoteEditor({
  noteId,
  sections,
  initialAnswers,
  mode,
}: {
  noteId: string;
  sections: NoteSection[];
  initialAnswers: Record<string, string | boolean>;
  mode: "draft" | "amend";
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(
    "idle"
  );
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initialAnswers);

  const autosave = useCallback(() => {
    if (mode !== "draft") return;
    setSaveState("saving");
    saveDraftAction(noteId, latest.current)
      .then(() => setSaveState("saved"))
      .catch(() => setSaveState("error"));
  }, [mode, noteId]);

  const setAnswer = (key: string, value: string | boolean) => {
    latest.current = { ...latest.current, [key]: value };
    setAnswers(latest.current);
    if (mode === "draft") {
      setSaveState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(autosave, 1200);
    }
  };

  // Flush pending edits if the user navigates away quickly.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const finalise = () => {
    if (
      !window.confirm(
        "Finalise this note? It will lock, and future edits are recorded as amendments."
      )
    )
      return;
    startTransition(async () => {
      await finaliseNoteAction(noteId, latest.current);
    });
  };

  const saveAmendment = () => {
    startTransition(async () => {
      await amendNoteAction(noteId, latest.current);
    });
  };

  const saveLabel = {
    idle: "",
    dirty: "Unsaved changes…",
    saving: "Saving…",
    saved: "All changes saved",
    error: "Couldn't save — check your connection",
  }[saveState];

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <section
          key={section.key}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
            {section.label}
          </h2>
          <div className="flex flex-col gap-4">
            {section.questions.map((q) => {
              const key = `${section.key}.${q.key}`;
              const value = answers[key];
              if (q.type === "checkbox") {
                return (
                  <label
                    key={key}
                    className="flex items-start gap-2.5 text-sm leading-relaxed"
                  >
                    <input
                      type="checkbox"
                      checked={value === true}
                      onChange={(e) => setAnswer(key, e.target.checked)}
                      className="mt-1 accent-primary"
                    />
                    <span>
                      <span className="font-medium">{q.label}: </span>
                      {q.text}
                    </span>
                  </label>
                );
              }
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <label htmlFor={key} className="text-sm font-medium">
                    {q.label}
                  </label>
                  {q.type === "paragraph" ? (
                    <textarea
                      id={key}
                      rows={Math.max(3, String(value ?? "").split("\n").length + 1)}
                      value={String(value ?? "")}
                      onChange={(e) => setAnswer(key, e.target.value)}
                      className={`${inputCls} font-mono text-[13px] leading-relaxed`}
                    />
                  ) : (
                    <input
                      id={key}
                      type={q.type === "date" ? "date" : "text"}
                      value={String(value ?? "")}
                      onChange={(e) => setAnswer(key, e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-sm backdrop-blur">
        <span className="flex items-center gap-2 text-xs text-muted">
          {saveState === "saved" && <Check size={14} className="text-primary" />}
          {saveState === "saving" && <CloudUpload size={14} />}
          {mode === "amend"
            ? "Amending a finalised note — saving records a new revision."
            : saveLabel}
        </span>
        {mode === "draft" ? (
          <button
            type="button"
            onClick={finalise}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            <Lock size={14} /> {isPending ? "Finalising…" : "Finalise note"}
          </button>
        ) : (
          <button
            type="button"
            onClick={saveAmendment}
            disabled={isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save amendment"}
          </button>
        )}
      </div>
    </div>
  );
}
