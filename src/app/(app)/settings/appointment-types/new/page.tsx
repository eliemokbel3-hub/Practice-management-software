import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppointmentTypeForm } from "@/components/appointment-type-form";
import { createAppointmentTypeAction } from "../actions";

export default function NewAppointmentTypePage() {
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
      />
    </div>
  );
}
