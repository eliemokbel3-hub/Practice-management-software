import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ServiceItemForm } from "@/components/service-item-form";
import { createServiceItemAction } from "../actions";

export default function NewBillableItemPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/settings/billable-items"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Billable items
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          New billable item
        </h1>
      </div>
      <ServiceItemForm action={createServiceItemAction} submitLabel="Create item" />
    </div>
  );
}
