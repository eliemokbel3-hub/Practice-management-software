"use client";

// The patient-facing booking wizard: service → time → details → done.

import { useState } from "react";
import { ArrowLeft, CalendarCheck, ChevronRight, Loader2 } from "lucide-react";
import type { Slot } from "@/lib/booking/availability";
import type { PublicAppointmentType } from "@/lib/booking/public";
import { formatPrice } from "@/lib/types";
import SlotPicker, { timeLabel } from "./slot-picker";
import { submitBookingAction } from "../actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

function slotDayLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default function BookingFlow({
  slug,
  timeZone,
  types,
  privacyNote = null,
  requireConsent = false,
}: {
  slug: string;
  timeZone: string;
  types: PublicAppointmentType[];
  privacyNote?: string | null;
  requireConsent?: boolean;
}) {
  const [type, setType] = useState<PublicAppointmentType | null>(
    types.length === 1 ? types[0] : null
  );
  const [slot, setSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    manageToken?: string;
    emailStatus?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!type || !slot) return;
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    const result = await submitBookingAction(slug, type.id, slot.startsAt, {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      note: String(form.get("note") ?? ""),
    });
    setSubmitting(false);
    if (result.ok) {
      setDone({ manageToken: result.manageToken, emailStatus: result.emailStatus });
    } else {
      setError(result.error ?? "Something went wrong — please try again.");
      // A taken slot means the times need refreshing.
      if (result.error?.includes("just taken")) setSlot(null);
    }
  }

  // ---- Step 4: booked ----
  if (done && type && slot) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <CalendarCheck size={24} />
        </span>
        <h2 className="text-lg font-semibold">You&apos;re booked in!</h2>
        <p className="text-sm text-muted">
          {type.name}
          <br />
          {slotDayLabel(slot.startsAt, timeZone)} at{" "}
          {timeLabel(slot.startsAt, timeZone)}
        </p>
        {done.emailStatus === "sent" ? (
          <p className="text-sm text-muted">
            A confirmation email is on its way with everything you need —
            including a link to cancel or reschedule if plans change.
          </p>
        ) : (
          <p className="text-sm text-muted">
            If plans change, you can{" "}
            <a
              href={`/book/manage/${done.manageToken}`}
              className="font-medium text-primary hover:underline"
            >
              cancel or reschedule here
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  // ---- Step 1: choose a service ----
  if (!type) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
          Choose an appointment
        </h2>
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t)}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong"
          >
            <span>
              <span className="block font-medium">{t.name}</span>
              <span className="mt-0.5 block text-sm text-muted">
                {t.durationMinutes} minutes
                {t.priceCents > 0 && <> · {formatPrice(t.priceCents)}</>}
              </span>
              {t.description && (
                <span className="mt-1 block text-sm text-faint">
                  {t.description}
                </span>
              )}
            </span>
            <ChevronRight
              size={16}
              className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
            />
          </button>
        ))}
      </div>
    );
  }

  const backToTypes = types.length > 1 && (
    <button
      type="button"
      onClick={() => {
        setType(null);
        setSlot(null);
        setError(null);
      }}
      className="inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-foreground"
    >
      <ArrowLeft size={14} /> Change appointment type
    </button>
  );

  // ---- Step 2: choose a time ----
  if (!slot) {
    return (
      <div className="flex flex-col gap-4">
        {backToTypes}
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="font-medium">{type.name}</p>
          <p className="text-sm text-muted">
            {type.durationMinutes} minutes
            {type.priceCents > 0 && <> · {formatPrice(type.priceCents)}</>}
          </p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <SlotPicker
          slug={slug}
          appointmentTypeId={type.id}
          timeZone={timeZone}
          onPick={(s) => {
            setSlot(s);
            setError(null);
          }}
        />
      </div>
    );
  }

  // ---- Step 3: your details ----
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setSlot(null)}
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> Change time
      </button>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="font-medium">{type.name}</p>
        <p className="text-sm text-muted">
          {slotDayLabel(slot.startsAt, timeZone)} at{" "}
          {timeLabel(slot.startsAt, timeZone)} · {type.durationMinutes} minutes
          {type.priceCents > 0 && <> · {formatPrice(type.priceCents)}</>}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
          Your details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-sm font-medium">
              First name *
            </label>
            <input id="firstName" name="firstName" required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last name *
            </label>
            <input id="lastName" name="lastName" required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              Mobile number *
            </label>
            <input id="phone" name="phone" type="tel" required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dateOfBirth" className="text-sm font-medium">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              className={inputCls}
            />
            <p className="text-xs text-faint">
              Helps us match you if you&apos;ve visited before.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="note" className="text-sm font-medium">
              Anything we should know?
            </label>
            <input
              id="note"
              name="note"
              placeholder="e.g. lower back pain, first visit"
              className={inputCls}
            />
          </div>
        </div>

        {privacyNote && (
          <p className="rounded-lg bg-surface-hover p-3 text-xs text-muted">
            {privacyNote}
          </p>
        )}
        {requireConsent && (
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
            />
            <span>
              I understand and agree to how my information will be handled.
            </span>
          </label>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          Confirm booking
        </button>
        <p className="text-center text-xs text-faint">
          You&apos;ll get an email confirmation with a link to cancel or
          reschedule.
        </p>
      </form>
    </div>
  );
}
