import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppointmentTypeForm } from "@/components/appointment-type-form";
import { listNoteTemplates } from "@/lib/data/note-templates";
import { listServiceItems } from "@/lib/data/service-items";
import { createAppointmentTypeAction } from "../actions";

export default async function NewAppointmentTypePage() {
  const [noteTemplates, serviceItems] = await Promise.all([
    listNoteTemplates(),
    listServiceItems(),
  ]);
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
          New appointment type
        </h1>
      </div>
      <AppointmentTypeForm
        action={createAppointmentTypeAction}
        submitLabel="Create appointment type"
        noteTemplates={noteTemplates}
        serviceItems={serviceItems}
      />
    </div>
  );
}
