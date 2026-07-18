import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { listServiceItems } from "@/lib/data/service-items";
import { formatPrice } from "@/lib/types";
import { setServiceItemActiveAction } from "./actions";

export default async function BillableItemsPage() {
  const items = await listServiceItems({ includeInactive: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/settings"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={14} /> Settings
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Billable items</h1>
          <p className="mt-1 text-sm text-muted">
            The services you invoice, with the item codes health funds expect on
            receipts.
          </p>
        </div>
        <Link
          href="/settings/billable-items/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} /> New item
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">GST</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={`border-b border-border last:border-0 ${
                  item.isActive ? "" : "opacity-50"
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs">{item.code || "—"}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/settings/billable-items/${item.id}/edit`}
                    className="font-medium text-primary hover:underline"
                  >
                    {item.name}
                  </Link>
                  {!item.isActive && (
                    <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs text-faint">
                      Archived
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{formatPrice(item.priceCents)}</td>
                <td className="px-4 py-3 text-muted">
                  {item.gstApplies ? "GST applies" : "GST-free"}
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={setServiceItemActiveAction.bind(
                      null,
                      item.id,
                      !item.isActive
                    )}
                  >
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover">
                      {item.isActive ? "Archive" : "Restore"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
