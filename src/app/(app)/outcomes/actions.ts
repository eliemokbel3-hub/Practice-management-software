"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createMeasureRequest,
  listMeasures,
  markRequestSent,
} from "@/lib/data/outcomes";
import { getPatient } from "@/lib/data/patients";
import { getClinic } from "@/lib/data/clinic";
import { getCurrentProfile } from "@/lib/supabase/server";
import { sendAndLog } from "@/lib/email/resend";
import { outcomeMeasureEmail, appBaseUrl } from "@/lib/email/templates";

export async function sendMeasureAction(patientId: string, form: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const measureId = String(form.get("measureId") ?? "");
  if (!measureId) throw new Error("Please choose a questionnaire.");

  const [patient, clinic, measures] = await Promise.all([
    getPatient(patientId),
    getClinic(),
    listMeasures(),
  ]);
  if (!patient) throw new Error("Patient not found.");
  const measure = measures.find((m) => m.id === measureId);
  if (!measure) throw new Error("Please choose a questionnaire.");

  const request = await createMeasureRequest(patientId, measureId);
  const url = `${appBaseUrl()}/measure/${request.token}`;

  let emailed = false;
  if (patient.email) {
    const message = outcomeMeasureEmail(
      {
        name: clinic.name,
        phone: clinic.phone,
        email: clinic.email,
        address: clinic.address,
        suburb: clinic.suburb,
        state: clinic.state,
        postcode: clinic.postcode,
      },
      patient.firstName,
      measure.name,
      url
    );
    const result = await sendAndLog({
      clinicId: profile.clinic_id,
      clinicName: clinic.name,
      patientId,
      emailType: "outcome_measure",
      to: patient.email,
      subject: message.subject,
      html: message.html,
      replyTo: clinic.email,
    });
    emailed = result.status === "sent";
    if (emailed) await markRequestSent(request.id);
  }

  revalidatePath(`/patients/${patientId}`);
  redirect(
    `/patients/${patientId}?measureToken=${request.token}&emailed=${emailed ? 1 : 0}`
  );
}
