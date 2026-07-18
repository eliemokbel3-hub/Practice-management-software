import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppointmentTypeForm } from "@/components/appointment-type-form";
import { getAppointmentType } from "@/lib/data/appointment-types";
import { listNoteTemplates } from "@/lib/data/note-templates";
import { listServiceItems } from "@/lib/data/service-items";
import { updateAppointmentTypeAction } from "../../actions";

export default async function EditAppointmentTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [type, noteTemplates, serviceItems] = await Promise.all([
    getAppointmentType(id),
    listNoteTemplates(),
    listServiceItems(),
  ]);
  if (!type) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/settings/appointment-types"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Appointment types
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          Edit: {type.name}
        </h1>
      </div>
      <AppointmentTypeForm
        type={type}
        action={updateAppointmentTypeAction.bind(null, type.id)}
        submitLabel="Save changes"
        noteTemplates={noteTemplates}
        serviceItems={serviceItems}
      />
    </div>
  );
}
