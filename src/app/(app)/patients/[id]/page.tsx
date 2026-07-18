import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  TriangleAlert,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { getPatient } from "@/lib/data/patients";
import { listUpcomingForPatient } from "@/lib/data/appointments";
import { listNotesForPatient } from "@/lib/data/clinical-notes";
import { listNoteTemplates } from "@/lib/data/note-templates";
import { listInvoicesForPatient } from "@/lib/data/invoices";
import { createNoteForPatientAction } from "@/app/(app)/notes/actions";
import { createInvoiceForPatientAction } from "@/app/(app)/invoices/actions";
import { formatPrice } from "@/lib/types";
import { formatLongDate, formatTime } from "@/lib/calendar-utils";
import { ageFromDob, fullName } from "@/lib/types";
import { setArchivedAction } from "../actions";

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 text-sm">{value ?? <span className="text-faint">—</span>}</dd>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const [upcoming, notes, templates, invoices] = await Promise.all([
    listUpcomingForPatient(id),
    listNotesForPatient(id),
    listNoteTemplates(),
    listInvoicesForPatient(id),
  ]);
  const newNoteAction = createNoteForPatientAction.bind(null, id);
  const newInvoiceAction = createInvoiceForPatientAction.bind(null, id);

  const age = ageFromDob(patient.dateOfBirth);
  const dob = patient.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const archiveAction = setArchivedAction.bind(
    null,
    patient.id,
    !patient.archivedAt
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/patients"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={14} /> Patients
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            {fullName(patient)}
            {patient.archivedAt && (
              <span className="ml-3 rounded-full border border-border px-2.5 py-1 align-middle text-xs font-normal text-faint">
                Archived
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {[
              age !== null ? `${age} yrs` : null,
              patient.sex,
              patient.occupation,
            ]
              .filter(Boolean)
              .join(" · ") || " "}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={archiveAction}>
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
            >
              {patient.archivedAt ? "Unarchive" : "Archive"}
            </button>
          </form>
          <Link
            href={`/patients/${patient.id}/edit`}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Pencil size={14} /> Edit
          </Link>
        </div>
      </div>

      {patient.alerts && (
        <div className="flex items-center gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning-soft-foreground">
          <TriangleAlert size={16} className="shrink-0" />
          {patient.alerts}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Personal details">
          <dl className="grid grid-cols-2 gap-4">
            <Item label="Date of birth" value={dob} />
            <Item label="Age" value={age !== null ? `${age} years` : null} />
            <Item label="Sex" value={patient.sex} />
            <Item label="Occupation" value={patient.occupation} />
            <Item label="Referral source" value={patient.referralSource} />
          </dl>
        </Card>

        <Card title="Contact">
          <dl className="flex flex-col gap-4">
            <Item
              label="Phone"
              value={
                patient.phone && (
                  <span className="inline-flex items-center gap-2">
                    <Phone size={14} className="text-faint" /> {patient.phone}
                  </span>
                )
              }
            />
            <Item
              label="Email"
              value={
                patient.email && (
                  <span className="inline-flex items-center gap-2">
                    <Mail size={14} className="text-faint" /> {patient.email}
                  </span>
                )
              }
            />
            <Item
              label="Address"
              value={
                (patient.addressLine1 || patient.suburb) && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={14} className="shrink-0 text-faint" />
                    {[
                      patient.addressLine1,
                      patient.suburb,
                      patient.state,
                      patient.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )
              }
            />
          </dl>
        </Card>

        <Card title="Emergency contact">
          <dl className="grid grid-cols-2 gap-4">
            <Item label="Name" value={patient.emergencyContactName} />
            <Item label="Phone" value={patient.emergencyContactPhone} />
            <Item
              label="Relationship"
              value={patient.emergencyContactRelationship}
            />
          </dl>
        </Card>

        <Card title="Health fund">
          <dl className="grid grid-cols-2 gap-4">
            <Item label="Fund" value={patient.healthFundName} />
            <Item label="Member no." value={patient.healthFundMemberNumber} />
          </dl>
        </Card>

        <div className="lg:col-span-2">
          <Card title="Medical history">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {patient.medicalHistory ?? (
                <span className="text-faint">Nothing recorded yet.</span>
              )}
            </p>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Treatment notes">
            <div className="flex flex-col gap-4">
              {notes.length === 0 ? (
                <p className="text-sm text-faint">No treatment notes yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {notes.map((n) => (
                    <li key={n.id} className="py-2 first:pt-0 last:pb-0">
                      <Link
                        href={`/notes/${n.id}`}
                        className="flex items-center justify-between gap-3 text-sm hover:underline"
                      >
                        <span>
                          {formatLongDate(new Date(n.createdAt))} ·{" "}
                          {n.practitionerName}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            n.status === "draft"
                              ? "bg-warning-soft text-warning-soft-foreground"
                              : "bg-primary-soft text-primary-soft-foreground"
                          }`}
                        >
                          {n.status === "draft" ? "Draft" : "Finalised"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <form action={newNoteAction} className="flex items-center gap-2">
                <select
                  name="templateId"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring"
                  defaultValue={templates.find((t) => t.isDefault)?.id}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
                  New note
                </button>
              </form>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Invoices">
            <div className="flex flex-col gap-4">
              {invoices.length === 0 ? (
                <p className="text-sm text-faint">No invoices yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {invoices.map((inv) => (
                    <li key={inv.id} className="py-2 first:pt-0 last:pb-0">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="flex items-center justify-between gap-3 text-sm hover:underline"
                      >
                        <span>
                          #{inv.invoiceNumber} ·{" "}
                          {new Date(inv.createdAt).toLocaleDateString("en-AU")} ·{" "}
                          {formatPrice(inv.totalCents)}
                        </span>
                        <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium capitalize text-muted">
                          {inv.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <form action={newInvoiceAction}>
                <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
                  New invoice
                </button>
              </form>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Upcoming appointments">
            {upcoming.length === 0 ? (
              <p className="text-sm text-faint">No upcoming appointments.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcoming.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/calendar/appointments/${a.id}`}
                      className="flex items-center gap-2.5 text-sm hover:underline"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded"
                        style={{ backgroundColor: a.typeColor ?? "#7edcd2" }}
                      />
                      {formatLongDate(new Date(a.startsAt))} ·{" "}
                      {formatTime(a.startsAt)} — {a.typeName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
