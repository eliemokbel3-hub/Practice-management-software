import Link from "next/link";
import { ArrowLeft, Download, Users, Calendar, Receipt } from "lucide-react";

const exports = [
  {
    type: "patients",
    icon: Users,
    title: "Patients",
    description: "All patient records with contact and demographic details.",
  },
  {
    type: "appointments",
    icon: Calendar,
    title: "Appointments",
    description: "Every appointment with patient, type, time and status.",
  },
  {
    type: "invoices",
    icon: Receipt,
    title: "Invoices",
    description: "All invoices with totals, GST and status.",
  },
];

export default function DataExportsPage() {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Data exports</h1>
        <p className="mt-1 text-sm text-muted">
          Download your clinic&apos;s data as spreadsheet-ready CSV files — for
          backups, accounting or moving elsewhere. Your data is always yours.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {exports.map(({ type, icon: Icon, title, description }) => (
          <a
            key={type}
            href={`/api/export/${type}`}
            className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
              <Icon size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{title}</span>
              <span className="block text-xs text-muted">{description}</span>
            </span>
            <Download
              size={16}
              className="text-faint transition-transform group-hover:translate-y-0.5"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
