import Link from "next/link";
import {
  CalendarClock,
  Tags,
  ChevronRight,
  FileText,
  Building2,
  Receipt,
  CreditCard,
} from "lucide-react";

const sections = [
  {
    href: "/settings/clinic",
    icon: Building2,
    title: "Clinic details",
    description:
      "Name, ABN, address and contact details shown on invoices — plus your GST rate.",
  },
  {
    href: "/settings/billable-items",
    icon: Receipt,
    title: "Billable items",
    description:
      "Services you invoice, with the item codes health funds expect on receipts.",
  },
  {
    href: "/settings/payment-types",
    icon: CreditCard,
    title: "Payment types",
    description: "The ways patients pay — HICAPS, EFTPOS, cash, or your own.",
  },
  {
    href: "/settings/note-templates",
    icon: FileText,
    title: "Note templates",
    description:
      "The structure of your treatment notes — sections, questions and pre-filled prompts.",
  },
  {
    href: "/settings/appointment-types",
    icon: Tags,
    title: "Appointment types",
    description:
      "The services you offer: names, durations, prices, colours and online-booking visibility.",
  },
  {
    href: "/settings/schedule",
    icon: CalendarClock,
    title: "Working hours",
    description: "Your regular weekly hours — the calendar shades time outside them.",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
              <Icon size={19} />
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between font-medium">
                {title}
                <ChevronRight
                  size={16}
                  className="text-faint transition-transform group-hover:translate-x-0.5"
                />
              </span>
              <span className="mt-1 block text-sm text-muted">{description}</span>
            </span>
          </Link>
        ))}
      </div>
      <p className="text-sm text-faint">
        Clinic details, note templates, billing items and communication templates
        arrive with their phases.
      </p>
    </div>
  );
}
