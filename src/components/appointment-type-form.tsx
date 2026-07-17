import type { AppointmentType } from "@/lib/types";

const PALETTE = [
  "#FFA3A3", "#FDCA86", "#feffb8", "#bcffb8", "#a8f0e4", "#7edcd2",
  "#97D7F7", "#9292ff", "#D9CCFF", "#F7B6EC", "#DDC6A6", "#ff8a8a",
];

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

function Field({
  label,
  name,
  hint,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function AppointmentTypeForm({
  type,
  action,
  submitLabel,
}: {
  type?: AppointmentType;
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const colours =
    type && !PALETTE.includes(type.color)
      ? [type.color, ...PALETTE]
      : PALETTE;

  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
        <Field label="Name *" name="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={type?.name}
            placeholder="e.g. Initial Consultation"
            className={inputCls}
          />
        </Field>
        <Field
          label="Category"
          name="category"
          hint="Your profession or service group — shown to patients when booking online."
        >
          <input
            id="category"
            name="category"
            defaultValue={type?.category ?? ""}
            placeholder="e.g. Osteopathy, Physiotherapy, Massage"
            className={inputCls}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" name="description">
            <input
              id="description"
              name="description"
              defaultValue={type?.description ?? ""}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Duration (minutes) *" name="durationMinutes">
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={5}
            step={5}
            required
            defaultValue={type?.durationMinutes ?? 30}
            className={inputCls}
          />
        </Field>
        <Field label="Price ($)" name="price">
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={type ? (type.priceCents / 100).toFixed(2) : "0.00"}
            className={inputCls}
          />
        </Field>
        <Field
          label="Buffer before (minutes)"
          name="bufferBefore"
          hint="Kept free before each appointment."
        >
          <input
            id="bufferBefore"
            name="bufferBefore"
            type="number"
            min={0}
            step={5}
            defaultValue={type?.bufferBeforeMinutes ?? 0}
            className={inputCls}
          />
        </Field>
        <Field
          label="Buffer after (minutes)"
          name="bufferAfter"
          hint="Kept free after each appointment."
        >
          <input
            id="bufferAfter"
            name="bufferAfter"
            type="number"
            min={0}
            step={5}
            defaultValue={type?.bufferAfterMinutes ?? 0}
            className={inputCls}
          />
        </Field>
        <Field
          label="Maximum patients"
          name="maxPatients"
          hint="More than 1 turns this into a group booking (e.g. classes)."
        >
          <input
            id="maxPatients"
            name="maxPatients"
            type="number"
            min={1}
            defaultValue={type?.maxPatients ?? 1}
            className={inputCls}
          />
        </Field>
        <Field label="Sort order" name="sortOrder">
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={type?.sortOrder ?? 0}
            className={inputCls}
          />
        </Field>
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <span className="text-sm font-medium">Colour</span>
          <div className="flex flex-wrap gap-2">
            {colours.map((c, i) => (
              <label key={c} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c}
                  defaultChecked={type ? type.color === c : i === 5}
                  className="peer sr-only"
                />
                <span
                  style={{ backgroundColor: c }}
                  className="block h-8 w-8 rounded-lg border border-border-strong ring-primary ring-offset-2 ring-offset-surface peer-checked:ring-2"
                />
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="bookableOnline"
            defaultChecked={type?.bookableOnline ?? true}
            className="accent-primary"
          />
          Patients can book this online (once online bookings launch)
        </label>
      </section>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
