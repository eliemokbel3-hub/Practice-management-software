import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { listLetterTemplates } from "@/lib/data/templates";
import { createLetterAction, deleteLetterAction } from "./actions";

export default async function LetterTemplatesPage() {
  const letters = await listLetterTemplates();

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Letter templates</h1>
        <p className="mt-1 text-sm text-muted">
          Reusable letters — referrals, treatment summaries, certificates — with
          placeholders filled in per patient.
        </p>
      </div>

      {letters.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {letters.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="truncate text-sm font-medium">{l.name}</span>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/settings/letter-templates/${l.id}/edit`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
                >
                  <Pencil size={12} /> Edit
                </Link>
                <form action={deleteLetterAction.bind(null, l.id)}>
                  <button
                    title="Delete"
                    className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={createLetterAction} className="flex items-center gap-2">
        <input
          name="name"
          required
          placeholder="New letter name, e.g. GP referral"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring"
        />
        <button className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
          <Plus size={15} /> Create
        </button>
      </form>
    </div>
  );
}
