import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

export default function SubscriptionPage() {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Subscription</h1>
        <p className="mt-1 text-sm text-muted">
          Your PracticeHub plan and billing.
        </p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Early access</p>
            <p className="text-xs text-faint">
              Full access while PracticeHub is in active development.
            </p>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
            Active
          </span>
        </div>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
          {[
            "Unlimited patients, appointments and invoices",
            "Online bookings, reminders and outcome measures",
            "All settings and templates",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check size={14} className="text-primary" /> {f}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-muted">
        Paid plans and card billing (via Stripe) arrive when PracticeHub opens
        to other clinics. There&apos;s nothing you need to do now — your account
        stays fully featured.
      </p>
    </div>
  );
}
