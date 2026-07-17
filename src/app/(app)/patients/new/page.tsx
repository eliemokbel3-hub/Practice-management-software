import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PatientForm } from "@/components/patient-form";
import { createPatientAction } from "../actions";

export default function NewPatientPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/patients"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Patients
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">New patient</h1>
      </div>
      <PatientForm action={createPatientAction} submitLabel="Create patient" />
    </div>
  );
}
