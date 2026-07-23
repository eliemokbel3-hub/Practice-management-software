import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { listCustomFields } from "@/lib/data/custom-fields";
import {
  createCustomFieldAction,
  deleteCustomFieldAction,
  toggleCustomFieldAction,
} from "./actions";

const TYPE_LABEL: Record<string, string> = {
  text: "Short text",
  paragraph: "Paragraph",
  date: "Date",
  select: "Dropdown",
  checkbox: "Checkbox",
};

const inputCls =
  "w-full input-base";

export default async function CustomFieldsPage() {
  const fields = await listCustomFields(true);

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
          Custom patient fields
        </h1>
        <p className="mt-1 text-sm text-muted">
          Extra fields added to every patient file, under “Additional
          information”.
        </p>
      </div>

      {fields.length > 0 && (
        <ul className="flex flex-col divide-y divide-border card">
          {fields.map((f) => (
            <li
              key={f.id}
              className={`flex items-center justify-between gap-3 px-5 py-3 ${
                f.isActive ? "" : "opacity-50"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.label}</p>
                <p className="text-xs text-faint">
                  {TYPE_LABEL[f.fieldType]}
                  {f.fieldType === "select" && f.options.length > 0
                    ? ` · ${f.options.join(", ")}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <form action={toggleCustomFieldAction.bind(null, f.id, !f.isActive)}>
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover">
                    {f.isActive ? "Archive" : "Restore"}
                  </button>
                </form>
                <form action={deleteCustomFieldAction.bind(null, f.id)}>
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

      <form
        action={createCustomFieldAction}
        className="flex flex-col gap-3 card p-4"
      >
        <input name="label" required placeholder="Field label, e.g. GP name" className={inputCls} />
        <div className="flex gap-2">
          <select name="fieldType" defaultValue="text" className={inputCls}>
            <option value="text">Short text</option>
            <option value="paragraph">Paragraph</option>
            <option value="date">Date</option>
            <option value="select">Dropdown</option>
            <option value="checkbox">Checkbox</option>
          </select>
        </div>
        <input
          name="options"
          placeholder="Dropdown choices, comma-separated (only for Dropdown)"
          className={inputCls}
        />
        <button className="flex items-center justify-center gap-1.5 btn-primary">
          <Plus size={15} /> Add field
        </button>
      </form>
    </div>
  );
}
