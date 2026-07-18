import type { ServiceItem } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

export function ServiceItemForm({
  item,
  action,
  submitLabel,
}: {
  item?: ServiceItem;
  action: (form: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form
      action={action}
      className="flex max-w-lg flex-col gap-4 rounded-xl border border-border bg-surface p-5"
    >
      <div className="grid grid-cols-[1fr_2fr] gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            Item code
          </label>
          <input
            id="code"
            name="code"
            defaultValue={item?.code}
            placeholder="e.g. 1802"
            className={inputCls}
          />
          <p className="text-xs text-faint">
            The code health funds expect on receipts.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Name *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={item?.name}
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="price" className="text-sm font-medium">
          Price ($, excluding GST)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          defaultValue={item ? (item.priceCents / 100).toFixed(2) : "0.00"}
          className={inputCls}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="gstApplies"
          defaultChecked={item?.gstApplies ?? false}
          className="accent-primary"
        />
        GST applies to this item
      </label>
      <div className="flex justify-end">
        <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
