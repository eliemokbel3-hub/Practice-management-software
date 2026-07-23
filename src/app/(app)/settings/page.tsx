import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Item {
  href: string;
  title: string;
  description: string;
}

const groups: { heading: string; items: Item[] }[] = [
  {
    heading: "Our clinic",
    items: [
      {
        href: "/settings/clinic",
        title: "Clinic details",
        description: "Name, ABN, address and contact details shown on invoices.",
      },
      {
        href: "/settings/branding",
        title: "Branding & logo",
        description: "Upload your logo to auto-theme the whole app.",
      },
      {
        href: "/settings/users",
        title: "Users & practitioners",
        description: "Staff logins, roles and the services each practitioner offers.",
      },
      {
        href: "/settings/integrations",
        title: "Integrations",
        description: "Connected services — database, email and AI.",
      },
      {
        href: "/settings/subscription",
        title: "Subscription",
        description: "Your PracticeHub plan and billing.",
      },
    ],
  },
  {
    heading: "Appointments",
    items: [
      {
        href: "/settings/online-bookings",
        title: "Online bookings",
        description: "Your public booking page, its rules and emails.",
      },
      {
        href: "/settings/appointment-types",
        title: "Appointment types",
        description: "Services you offer: durations, prices, colours, online visibility.",
      },
      {
        href: "/settings/block-types",
        title: "Unavailable block types",
        description: "Reasons for blocking out time — lunch, admin, leave.",
      },
      {
        href: "/settings/recall-types",
        title: "Recall types",
        description: "Reminders to bring patients back for review.",
      },
      {
        href: "/settings/schedule",
        title: "Working hours",
        description: "Your regular weekly hours.",
      },
    ],
  },
  {
    heading: "Patients",
    items: [
      {
        href: "/settings/note-templates",
        title: "Treatment note templates",
        description: "The structure of your clinical notes.",
      },
      {
        href: "/settings/form-templates",
        title: "Patient form templates",
        description: "Intake and consent forms.",
      },
      {
        href: "/settings/body-charts",
        title: "Body chart templates",
        description: "Named body diagrams for marking findings.",
      },
      {
        href: "/settings/letter-templates",
        title: "Letter templates",
        description: "Reusable referrals, summaries and certificates.",
      },
      {
        href: "/settings/referral-sources",
        title: "Referral sources",
        description: "How patients find you.",
      },
      {
        href: "/settings/concession-types",
        title: "Concession types",
        description: "Pensioner, student and other discount categories.",
      },
      {
        href: "/settings/custom-fields",
        title: "Custom patient fields",
        description: "Extra fields on every patient file.",
      },
      {
        href: "/settings/patient-privacy",
        title: "Patient privacy",
        description: "Privacy note and booking consent.",
      },
    ],
  },
  {
    heading: "Finances",
    items: [
      {
        href: "/settings/billable-items",
        title: "Billable items",
        description: "Services you invoice, with health-fund item codes.",
      },
      {
        href: "/settings/payment-types",
        title: "Payment types",
        description: "The ways patients pay — HICAPS, EFTPOS, cash.",
      },
      {
        href: "/settings/taxes",
        title: "Taxes",
        description: "Tax rates applied to billable items.",
      },
    ],
  },
  {
    heading: "Communication",
    items: [
      {
        href: "/settings/message-templates",
        title: "Message templates",
        description: "The wording of confirmation, reminder and other emails.",
      },
      {
        href: "/settings/sms",
        title: "SMS settings",
        description: "Text-message confirmations and reminders.",
      },
    ],
  },
  {
    heading: "Data & docs",
    items: [
      {
        href: "/settings/data-imports",
        title: "Data imports",
        description: "Bring patients in from a spreadsheet.",
      },
      {
        href: "/settings/data-exports",
        title: "Data exports",
        description: "Download your data as CSV.",
      },
      {
        href: "/settings/documents",
        title: "Documents & printing",
        description: "How printed invoices and documents look.",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Settings</h1>
      {groups.map((group) => (
        <section key={group.heading} className="flex flex-col gap-3">
          <h2 className="section-label">{group.heading}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group card card-hover flex items-start justify-between gap-3 p-4"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {item.description}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  className="mt-0.5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
