import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { getClinicBySlug, listBookableTypes } from "@/lib/booking/public";
import BookingFlow from "../components/booking-flow";

export const dynamic = "force-dynamic";

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();

  const header = (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{clinic.name}</h1>
      <p className="mt-1 text-sm text-muted">Book an appointment</p>
      {clinic.booking.welcomeMessage && (
        <p className="mt-3 text-sm text-muted">{clinic.booking.welcomeMessage}</p>
      )}
    </div>
  );

  if (!clinic.booking.enabled) {
    return (
      <>
        {header}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-6">
          <p className="font-medium">Online booking is currently unavailable.</p>
          <p className="text-sm text-muted">
            Please contact the clinic directly to make an appointment.
          </p>
          {clinic.phone && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Phone size={14} className="text-faint" />
              <a href={`tel:${clinic.phone}`} className="text-primary hover:underline">
                {clinic.phone}
              </a>
            </p>
          )}
        </div>
      </>
    );
  }

  const types = await listBookableTypes(clinic.id);

  return (
    <>
      {header}
      {types.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="font-medium">No appointments are bookable online yet.</p>
          <p className="mt-1 text-sm text-muted">
            Please contact the clinic directly to make an appointment.
          </p>
        </div>
      ) : (
        <BookingFlow
          slug={clinic.slug}
          timeZone={clinic.timezone}
          types={types}
          privacyNote={clinic.booking.privacyNote}
          requireConsent={clinic.booking.requireConsent}
        />
      )}
    </>
  );
}
