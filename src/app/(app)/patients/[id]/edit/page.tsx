import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PatientForm } from "@/components/patient-form";
import { getPatient } from "@/lib/data/patients";
import { fullName } from "@/lib/types";
import { updatePatientAction } from "../../actions";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const action = updatePatientAction.bind(null, patient.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/patients/${patient.id}`}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> {fullName(patient)}
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Edit patient</h1>
      </div>
      <PatientForm
        patient={patient}
        action={action}
        submitLabel="Save changes"
      />
    </div>
  );
}
