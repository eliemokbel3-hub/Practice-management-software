import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ServiceItemForm } from "@/components/service-item-form";
import { getServiceItem } from "@/lib/data/service-items";
import { updateServiceItemAction } from "../../actions";

export default async function EditBillableItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getServiceItem(id);
  if (!item) notFound();

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
          Edit: {item.name}
        </h1>
      </div>
      <ServiceItemForm
        item={item}
        action={updateServiceItemAction.bind(null, item.id)}
        submitLabel="Save changes"
      />
    </div>
  );
}
