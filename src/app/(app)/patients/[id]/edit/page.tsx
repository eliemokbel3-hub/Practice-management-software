import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PatientForm } from "@/components/patient-form";
import { getPatient } from "@/lib/data/patients";
import { listConcessionTypes, listReferralSources } from "@/lib/data/lists";
import { listCustomFields } from "@/lib/data/custom-fields";
import { fullName } from "@/lib/types";
import { updatePatientAction } from "../../actions";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patient, referralSources, concessionTypes, customFields] =
    await Promise.all([
      getPatient(id),
      listReferralSources(),
      listConcessionTypes(),
      listCustomFields(),
    ]);
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
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Edit patient</h1>
      </div>
      <PatientForm
        patient={patient}
        action={action}
        submitLabel="Save changes"
        referralSources={referralSources.map((r) => r.name)}
        concessionTypes={concessionTypes.map((c) => c.name)}
        customFields={customFields}
      />
    </div>
  );
}
