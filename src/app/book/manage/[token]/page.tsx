import { CalendarX2, CheckCircle2, Phone } from "lucide-react";
import { getBookingByToken } from "@/lib/booking/public";
import {
  formatLongDateInTz,
  formatTimeInTz,
} from "@/lib/booking/timezone";
import ManageBooking from "./manage-booking";
import { BrandLogo, BrandStyle, BrandWatermark } from "../../components/brand";

export const dynamic = "force-dynamic";

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="font-medium">This link isn&apos;t valid.</p>
        <p className="mt-1 text-sm text-muted">
          It may have been mistyped — check the link in your email, or contact
          the clinic directly.
        </p>
      </div>
    );
  }

  const { clinic, isPast } = booking;
  const starts = new Date(booking.startsAt);
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BrandStyle brandColor={clinic.brandColor} />
        <BrandWatermark logo={clinic.logo} />
        <BrandLogo logo={clinic.logo} name={clinic.name} />
        <h1 className="text-2xl font-semibold tracking-tight">{clinic.name}</h1>
        <p className="mt-1 text-sm text-muted">Your appointment</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{booking.typeName}</p>
            <p className="mt-1 text-sm text-muted">
              {formatLongDateInTz(starts, clinic.timezone)}
            </p>
            <p className="text-sm text-muted">
              {formatTimeInTz(starts, clinic.timezone)}
            </p>
          </div>
          {isCancelled ? (
            <span className="flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-xs font-medium text-danger">
              <CalendarX2 size={13} /> Cancelled
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
              <CheckCircle2 size={13} /> {isPast ? "Past" : "Confirmed"}
            </span>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          This appointment has been cancelled.{" "}
          <a
            href={`/book/${clinic.slug}`}
            className="font-medium text-primary hover:underline"
          >
            Book a new appointment
          </a>
        </div>
      )}

      {!isCancelled && isPast && (
        <p className="text-sm text-muted">
          This appointment has already taken place.
        </p>
      )}

      {!isCancelled && !isPast && booking.canChange && booking.typeId && (
        <ManageBooking
          token={token}
          slug={clinic.slug}
          appointmentTypeId={booking.typeId}
          timeZone={clinic.timezone}
        />
      )}

      {!isCancelled && !isPast && (!booking.canChange || !booking.typeId) && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm">
            Online changes close {clinic.booking.cancelMinHours} hours before
            your appointment. To make a change now, please contact the clinic.
          </p>
          {clinic.phone && (
            <p className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-faint" />
              <a
                href={`tel:${clinic.phone}`}
                className="text-primary hover:underline"
              >
                {clinic.phone}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
