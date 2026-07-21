"use client";

// Simple question builder for a patient form template. Add rows (label +
// type), reorder-free for now, and save the whole set.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import type { NoteQuestion, NoteQuestionType } from "@/lib/types";
import { saveFormQuestionsAction } from "../../actions";

const TYPES: { value: NoteQuestionType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "paragraph", label: "Paragraph" },
  { value: "checkbox", label: "Checkbox / consent" },
  { value: "date", label: "Date" },
];

interface Row {
  key: string;
  label: string;
  type: NoteQuestionType;
  text: string; // consent statement, for checkboxes
}

function slug(s: string, i: number): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `q${i + 1}`;
}

export function FormBuilder({
  id,
  initial,
}: {
  id: string;
  initial: NoteQuestion[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    initial.map((q) => ({
      key: q.key,
      label: q.label,
      type: q.type,
      text: q.text ?? "",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setSaved(false);
  }
  function add() {
    setRows((prev) => [...prev, { key: "", label: "", type: "text", text: "" }]);
    setSaved(false);
  }
  function remove(i: number) {
    setRows((prev) => prev.filter((_, j) => j !== i));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const questions: NoteQuestion[] = rows
      .filter((r) => r.label.trim())
      .map((r, i) => ({
        key: r.key || slug(r.label, i),
        label: r.label.trim(),
        type: r.type,
        ...(r.type === "checkbox" && r.text.trim()
          ? { text: r.text.trim() }
          : {}),
      }));
    const result = await saveFormQuestionsAction(id, questions);
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't save.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-faint">
          No questions yet. Add your first below.
        </p>
      )}

      {rows.map((row, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
        >
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="shrink-0 text-faint" />
            <input
              value={row.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Question label"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring"
            />
            <select
              value={row.type}
              onChange={(e) =>
                update(i, { type: e.target.value as NoteQuestionType })
              }
              className="rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none focus:border-ring"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => remove(i)}
              aria-label="Remove"
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {row.type === "checkbox" && (
            <input
              value={row.text}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="Statement the patient agrees to (e.g. I consent to treatment)"
              className="ml-6 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring"
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-between">
        <button
          onClick={add}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
        >
          <Plus size={15} /> Add question
        </button>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-danger">{error}</span>}
          {saved && (
            <span className="flex items-center gap-1 text-sm text-primary">
              <Check size={14} /> Saved
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save form
          </button>
        </div>
      </div>
    </div>
  );
}
