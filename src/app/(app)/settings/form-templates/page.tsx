import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { listFormTemplates } from "@/lib/data/templates";
import { createFormAction, deleteFormAction } from "./actions";

export default async function FormTemplatesPage() {
  const forms = await listFormTemplates();

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          Patient form templates
        </h1>
        <p className="mt-1 text-sm text-muted">
          Intake and consent forms — the questions patients answer. Built on the
          same engine as your note templates and outcome measures.
        </p>
      </div>

      {forms.length > 0 && (
        <ul className="flex flex-col divide-y divide-border card">
          {forms.map((f) => {
            const count = f.sections.reduce(
              (n, s) => n + s.questions.length,
              0
            );
            return (
              <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-faint">
                    {count} question{count === 1 ? "" : "s"}
                    {f.description ? ` · ${f.description}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/settings/form-templates/${f.id}/edit`}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
                  >
                    <Pencil size={12} /> Edit
                  </Link>
                  <form action={deleteFormAction.bind(null, f.id)}>
                    <button
                      title="Delete"
                      className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        action={createFormAction}
        className="flex flex-col gap-2 card p-4"
      >
        <input
          name="name"
          required
          placeholder="Form name, e.g. New patient intake"
          className="input-base"
        />
        <input
          name="description"
          placeholder="Short description (optional)"
          className="input-base"
        />
        <button className="flex items-center justify-center gap-1.5 btn-primary">
          <Plus size={15} /> Create form
        </button>
      </form>

      <p className="text-xs text-faint">
        Sending forms to patients by link (like outcome measures) is the next
        step; for now this defines your forms.
      </p>
    </div>
  );
}
