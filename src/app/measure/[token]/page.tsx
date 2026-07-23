import { CheckCircle2 } from "lucide-react";
import { getMeasureRequestByToken } from "@/lib/outcomes/public";
import MeasureForm from "./measure-form";
import { BrandLogo, BrandStyle, BrandWatermark } from "@/app/book/components/brand";

export const dynamic = "force-dynamic";

export default async function MeasurePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getMeasureRequestByToken(token);

  if (!request) {
    return (
      <div className="card p-6">
        <p className="font-medium">This link isn&apos;t valid.</p>
        <p className="mt-1 text-sm text-muted">
          It may have been mistyped — check the link in your email, or contact
          the clinic.
        </p>
      </div>
    );
  }

  if (request.completed) {
    return (
      <div className="flex flex-col items-center gap-4 card p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <CheckCircle2 size={24} />
        </span>
        <h1 className="text-lg font-semibold">Already completed</h1>
        <p className="text-sm text-muted">
          This questionnaire has already been submitted to {request.clinicName}.
          Nothing more to do!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BrandStyle brandColor={request.clinicBrandColor} />
      <BrandWatermark logo={request.clinicLogo} logoDark={request.clinicLogoDark} />
      <div>
        <BrandLogo
          logo={request.clinicLogo}
          logoDark={request.clinicLogoDark}
          name={request.clinicName}
        />
        <h1 className="text-2xl font-semibold tracking-tight">
          {request.measureName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Hi {request.patientFirstName} — {request.clinicName} has asked you to
          fill in this short questionnaire.
        </p>
      </div>
      <MeasureForm
        token={token}
        definition={request.definition}
        clinicName={request.clinicName}
      />
    </div>
  );
}
