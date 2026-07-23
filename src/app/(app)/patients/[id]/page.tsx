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
import { listMeasures, listRequestsForPatient } from "@/lib/data/outcomes";
import { listCustomFields } from "@/lib/data/custom-fields";
import { createNoteForPatientAction } from "@/app/(app)/notes/actions";
import { createInvoiceForPatientAction } from "@/app/(app)/invoices/actions";
import { sendMeasureAction } from "@/app/(app)/outcomes/actions";
import { OutcomeProgress } from "@/components/outcome-progress";
import { appBaseUrl } from "@/lib/email/templates";
import { formatPrice } from "@/lib/types";
import { formatLongDate, formatTime } from "@/lib/calendar-utils";
import { ageFromDob, fullName } from "@/lib/types";
import { setArchivedAction } from "../actions";

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">
        {value ?? <span className="text-faint">—</span>}
      </dd>
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
    <section className="card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ measureToken?: string; emailed?: string }>;
}) {
  const { id } = await params;
  const { measureToken, emailed } = await searchParams;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const [
    upcoming,
    notes,
    templates,
    invoices,
    measures,
    measureRequests,
    customFields,
  ] = await Promise.all([
    listUpcomingForPatient(id),
    listNotesForPatient(id),
    listNoteTemplates(),
    listInvoicesForPatient(id),
    listMeasures(),
    listRequestsForPatient(id),
    listCustomFields(),
  ]);
  const customWithValues = customFields
    .map((f) => ({ label: f.label, value: patient.custom?.[f.id] ?? "" }))
    .filter((f) => f.value.trim());
  const sendMeasure = sendMeasureAction.bind(null, id);

  // One progress series per measure with at least two scored responses.
  const progressByMeasure = new Map<
    string,
    { name: string; unit: string; higherIsBetter: boolean; points: { date: string; score: number }[] }
  >();
  for (const r of measureRequests) {
    if (r.response?.score == null) continue;
    const entry = progressByMeasure.get(r.measureCode) ?? {
      name: r.measureName,
      unit: r.unit,
      higherIsBetter: r.higherIsBetter,
      points: [],
    };
    entry.points.push({ date: r.response.completedAt, score: r.response.score });
    progressByMeasure.set(r.measureCode, entry);
  }
  const chartMax = (unit: string) =>
    unit.includes("80") ? 80 : unit.includes("10") ? 10 : 100;
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
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
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
              className="btn-secondary"
            >
              {patient.archivedAt ? "Unarchive" : "Archive"}
            </button>
          </form>
          <Link
            href={`/patients/${patient.id}/edit`}
            className="flex items-center gap-2 btn-primary"
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
            <Item label="Concession" value={patient.concession} />
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

        {customWithValues.length > 0 && (
          <div className="lg:col-span-2">
            <Card title="Additional information">
              <dl className="grid gap-4 sm:grid-cols-2">
                {customWithValues.map((f) => (
                  <Item key={f.label} label={f.label} value={f.value} />
                ))}
              </dl>
            </Card>
          </div>
        )}

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
                  {[...notes]
                    .sort(
                      (a, b) =>
                        Number(Boolean(a.archivedAt)) -
                        Number(Boolean(b.archivedAt))
                    )
                    .map((n) => (
                      <li
                        key={n.id}
                        className={`py-2 first:pt-0 last:pb-0 ${
                          n.archivedAt ? "opacity-55" : ""
                        }`}
                      >
                        <Link
                          href={`/notes/${n.id}`}
                          className="flex items-center justify-between gap-3 text-sm hover:underline"
                        >
                          <span>
                            {formatLongDate(new Date(n.createdAt))} ·{" "}
                            {n.practitionerName}
                          </span>
                          {n.archivedAt ? (
                            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-faint">
                              Archived
                            </span>
                          ) : (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                n.status === "draft"
                                  ? "bg-warning-soft text-warning-soft-foreground"
                                  : "bg-primary-soft text-primary-soft-foreground"
                              }`}
                            >
                              {n.status === "draft" ? "Draft" : "Finalised"}
                            </span>
                          )}
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
                <button className="btn-secondary">
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
                <button className="btn-secondary">
                  New invoice
                </button>
              </form>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Outcome measures">
            <div className="flex flex-col gap-4">
              {measureToken && (
                <div className="flex flex-col gap-2 rounded-lg bg-primary-soft p-4 text-sm text-primary-soft-foreground">
                  <p className="font-medium">
                    Questionnaire created
                    {emailed === "1"
                      ? " and emailed to the patient."
                      : ". Share this link with the patient:"}
                  </p>
                  {emailed !== "1" && (
                    <input
                      readOnly
                      value={`${appBaseUrl()}/measure/${measureToken}`}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none"
                    />
                  )}
                </div>
              )}

              {[...progressByMeasure.values()]
                .filter((m) => m.points.length >= 2)
                .map((m) => (
                  <div key={m.name} className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{m.name}</p>
                    <OutcomeProgress
                      points={m.points}
                      maxScore={chartMax(m.unit)}
                      higherIsBetter={m.higherIsBetter}
                    />
                  </div>
                ))}

              {measureRequests.length === 0 ? (
                <p className="text-sm text-faint">
                  Nothing sent yet. Choose a questionnaire below to send one by
                  link.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {measureRequests.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                    >
                      <span>
                        {r.measureName.split(" (")[0]} ·{" "}
                        {formatLongDate(new Date(r.createdAt))}
                      </span>
                      {r.response ? (
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-soft-foreground">
                          {r.response.display}
                          {r.response.band ? ` · ${r.response.band}` : ""}
                        </span>
                      ) : (
                        <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning-soft-foreground">
                          Awaiting response
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <form action={sendMeasure} className="flex items-center gap-2">
                <select
                  name="measureId"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring sm:flex-none"
                >
                  {measures.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button className="shrink-0 btn-secondary">
                  Send questionnaire
                </button>
              </form>
              {!patient.email && (
                <p className="text-xs text-faint">
                  This patient has no email on file — you&apos;ll get a link to
                  share instead.
                </p>
              )}
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
