import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export interface SettingsListItem {
  id: string;
  name: string;
  meta?: React.ReactNode;
  isActive: boolean;
}

/**
 * Shared chrome for a simple managed list in Settings: a titled list with
 * archive/restore + delete per row, and an add form. Extra add-form inputs
 * (colour, interval, …) can be supplied via `addFields`.
 */
export function SettingsList({
  title,
  description,
  items,
  addPlaceholder,
  addFields,
  createAction,
  toggleAction,
  deleteAction,
  note,
}: {
  title: string;
  description: string;
  items: SettingsListItem[];
  addPlaceholder: string;
  addFields?: React.ReactNode;
  createAction: (form: FormData) => Promise<void>;
  toggleAction: (id: string, active: boolean) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  note?: React.ReactNode;
}) {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-3 px-5 py-3 ${
                item.isActive ? "" : "opacity-50"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {item.meta && (
                  <div className="mt-0.5 text-xs text-faint">{item.meta}</div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <form action={toggleAction.bind(null, item.id, !item.isActive)}>
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover">
                    {item.isActive ? "Archive" : "Restore"}
                  </button>
                </form>
                <form action={deleteAction.bind(null, item.id)}>
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
        action={createAction}
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <div className="flex items-center gap-2">
          <input
            name="name"
            required
            placeholder={addPlaceholder}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring"
          />
          <button className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
            <Plus size={15} /> Add
          </button>
        </div>
        {addFields}
      </form>

      {note && <p className="text-xs text-faint">{note}</p>}
    </div>
  );
}
