"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, CloudUpload, Lock, Mic, Sparkles, X } from "lucide-react";
import type { NoteSection } from "@/lib/types";
import {
  amendNoteAction,
  finaliseNoteAction,
  saveDraftAction,
} from "@/app/(app)/notes/actions";
import { tidyNoteAction } from "@/app/(app)/notes/ai-actions";

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

  const [proposal, setProposal] = useState<Record<string, string> | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const tidy = () => {
    setAiBusy(true);
    setAiError(null);
    tidyNoteAction(noteId, latest.current)
      .then((result) => {
        if (result.error) setAiError(result.error);
        else setProposal(result.answers ?? null);
      })
      .catch(() => setAiError("Something went wrong — try again."))
      .finally(() => setAiBusy(false));
  };

  const changedKeys = proposal
    ? Object.keys(proposal).filter(
        (key) => proposal[key] !== String(answers[key] ?? "")
      )
    : [];

  const applyProposal = () => {
    if (!proposal) return;
    latest.current = { ...latest.current, ...proposal };
    setAnswers(latest.current);
    setProposal(null);
    if (mode === "draft") {
      setSaveState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(autosave, 400);
    }
  };

  const labelFor = (key: string): string => {
    for (const section of sections) {
      for (const q of section.questions) {
        if (`${section.key}.${q.key}` === key) return `${section.label} · ${q.label}`;
      }
    }
    return key;
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          title="Coming soon — record the consult and have a draft note written for you"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-faint"
        >
          <Mic size={14} /> Record consult
          <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] uppercase tracking-wide">
            Soon
          </span>
        </button>
        <button
          type="button"
          onClick={tidy}
          disabled={aiBusy}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-60"
        >
          <Sparkles size={14} />
          {aiBusy ? "Tidying…" : "Tidy this note"}
        </button>
        {aiError && <span className="text-xs text-danger">{aiError}</span>}
      </div>

      {proposal && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-primary/40 bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={15} className="text-primary" /> Suggested tidy-up
              — nothing is changed until you apply it
            </h2>
            <button
              type="button"
              onClick={() => setProposal(null)}
              aria-label="Discard suggestion"
              className="rounded-lg p-1.5 text-faint hover:bg-surface-hover hover:text-foreground"
            >
              <X size={15} />
            </button>
          </div>
          {changedKeys.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing to tidy — the note already reads well.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {changedKeys.map((key) => (
                <div key={key}>
                  <p className="text-xs uppercase tracking-wide text-faint">
                    {labelFor(key)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-primary-soft/30 px-3 py-2 text-sm leading-relaxed">
                    {proposal[key]}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setProposal(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
            >
              Discard
            </button>
            {changedKeys.length > 0 && (
              <button
                type="button"
                onClick={applyProposal}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Apply tidy-up
              </button>
            )}
          </div>
        </div>
      )}

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
