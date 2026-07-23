import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ExternalLink,
  MailWarning,
} from "lucide-react";
import { getBookingConfig } from "@/lib/data/clinic";
import { emailIsConfigured } from "@/lib/email/resend";
import { sendRemindersNowAction, updateBookingSettingsAction } from "./actions";

const inputCls =
  "w-full input-base";
const checkboxCls = "h-4 w-4 accent-[var(--primary)]";

function NumberField({
  label,
  name,
  value,
  hint,
}: {
  label: string;
  name: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min={0}
        defaultValue={value}
        className={inputCls}
      />
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

export default async function OnlineBookingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ran?: string;
    sent?: string;
    skipped?: string;
    failed?: string;
  }>;
}) {
  const [{ slug, settings }, params, headerList] = await Promise.all([
    getBookingConfig(),
    searchParams,
    headers(),
  ]);
  const emailReady = emailIsConfigured();

  const host = headerList.get("host") ?? "localhost:3001";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const bookingUrl = slug ? `${protocol}://${host}/book/${slug}` : null;

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Online bookings</h1>
        <p className="mt-1 text-sm text-muted">
          Your public booking page and the emails that go with it.
        </p>
      </div>

      {params.ran === "1" && (
        <div className="rounded-xl border border-border bg-primary-soft p-4 text-sm text-primary-soft-foreground">
          Reminder run finished: {params.sent ?? 0} sent, {params.skipped ?? 0}{" "}
          skipped, {params.failed ?? 0} failed.
        </div>
      )}

      {bookingUrl && (
        <div className="flex items-center justify-between gap-3 card p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium">Your booking page</p>
            <p className="mt-1 truncate text-sm text-muted">{bookingUrl}</p>
          </div>
          <a
            href={`/book/${slug}`}
            target="_blank"
            className="flex shrink-0 items-center gap-1.5 btn-secondary px-3"
          >
            <ExternalLink size={14} /> Open
          </a>
        </div>
      )}

      <div
        className={`flex items-start gap-3 rounded-xl border border-border p-5 ${
          emailReady ? "bg-surface" : "bg-warning-soft"
        }`}
      >
        {emailReady ? (
          <>
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Email sending is set up.</p>
              <p className="mt-1 text-sm text-muted">
                Confirmations, reminders and cancellation notices go out
                automatically.
              </p>
            </div>
          </>
        ) : (
          <>
            <MailWarning
              size={18}
              className="mt-0.5 shrink-0 text-warning-soft-foreground"
            />
            <div className="text-warning-soft-foreground">
              <p className="text-sm font-medium">
                Email sending isn&apos;t set up yet.
              </p>
              <p className="mt-1 text-sm">
                Online bookings still work — patients just won&apos;t receive
                confirmation or reminder emails until a Resend account is
                connected. Every email that would have gone out is recorded, so
                nothing is lost.
              </p>
            </div>
          </>
        )}
      </div>

      <form action={updateBookingSettingsAction} className="flex flex-col gap-5">
        <section className="flex flex-col gap-4 card p-5">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              className={checkboxCls}
            />
            Accept online bookings
          </label>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="slug" className="text-sm font-medium">
              Booking link
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-faint">/book/</span>
              <input
                id="slug"
                name="slug"
                required
                defaultValue={slug ?? ""}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={inputCls}
              />
            </div>
            <p className="text-xs text-faint">
              Lowercase letters, numbers and hyphens. Changing it breaks links
              you&apos;ve already shared.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="welcomeMessage" className="text-sm font-medium">
              Welcome message
            </label>
            <textarea
              id="welcomeMessage"
              name="welcomeMessage"
              rows={2}
              defaultValue={settings.welcomeMessage ?? ""}
              placeholder="Shown at the top of your booking page — e.g. parking tips or what to bring."
              className={inputCls}
            />
          </div>
        </section>

        <section className="grid gap-4 card p-5 sm:grid-cols-2">
          <NumberField
            label="Minimum notice (hours)"
            name="minNoticeHours"
            value={settings.minNoticeHours}
            hint="How soon before a slot patients can no longer book it."
          />
          <NumberField
            label="Book up to (days ahead)"
            name="maxDaysAhead"
            value={settings.maxDaysAhead}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slotIntervalMinutes" className="text-sm font-medium">
              Offer start times every
            </label>
            <select
              id="slotIntervalMinutes"
              name="slotIntervalMinutes"
              defaultValue={settings.slotIntervalMinutes}
              className={inputCls}
            >
              {[15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </div>
          <NumberField
            label="Self-service changes close (hours before)"
            name="cancelMinHours"
            value={settings.cancelMinHours}
            hint="After this, the emailed cancel/reschedule link says to phone the clinic."
          />
        </section>

        <section className="flex flex-col gap-4 card p-5">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="remindersEnabled"
              defaultChecked={settings.remindersEnabled}
              className={checkboxCls}
            />
            Send reminder emails before appointments
          </label>
          <div className="max-w-56">
            <NumberField
              label="Send reminders (hours before)"
              name="reminderHoursBefore"
              value={settings.reminderHoursBefore}
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="notifyClinic"
              defaultChecked={settings.notifyClinic}
              className={checkboxCls}
            />
            Email the clinic about online bookings, cancellations and changes
          </label>
        </section>

        <div className="flex justify-end">
          <button className="btn-primary px-5">
            Save booking settings
          </button>
        </div>
      </form>

      <section className="flex items-center justify-between gap-3 card p-5">
        <div>
          <p className="text-sm font-medium">Due reminders</p>
          <p className="mt-1 text-sm text-muted">
            Reminders send automatically once the app is deployed with a
            schedule. While developing, run them by hand.
          </p>
        </div>
        <form action={sendRemindersNowAction}>
          <button className="flex shrink-0 items-center gap-1.5 btn-secondary px-3">
            <BellRing size={14} /> Send now
          </button>
        </form>
      </section>
    </div>
  );
}
