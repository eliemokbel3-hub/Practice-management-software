import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  listMessageTemplates,
  TEMPLATE_META,
  type TemplateKind,
} from "@/lib/data/message-templates";
import { saveMessageTemplateAction } from "./actions";

const KINDS: TemplateKind[] = [
  "confirmation",
  "reminder",
  "cancellation",
  "followup",
];

const PLACEHOLDERS = [
  "{patient_first_name}",
  "{clinic_name}",
  "{appointment_type}",
  "{appointment_date}",
  "{appointment_time}",
  "{appointment_details}",
  "{manage_link}",
];

export default async function MessageTemplatesPage() {
  const existing = await listMessageTemplates();
  const byKind = new Map(existing.map((t) => [t.kind, t]));

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          Message templates
        </h1>
        <p className="mt-1 text-sm text-muted">
          The wording of the emails patients receive. Leave a template inactive
          to use PracticeHub&apos;s built-in default.
        </p>
      </div>

      <div className="card p-4 text-sm">
        <p className="font-medium">Placeholders you can use</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map((p) => (
            <code
              key={p}
              className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-xs text-muted"
            >
              {p}
            </code>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">
          {"{appointment_details}"} inserts the date/time card;{" "}
          {"{manage_link}"} inserts the cancel/reschedule link.
        </p>
      </div>

      {KINDS.map((kind) => {
        const t = byKind.get(kind);
        const meta = TEMPLATE_META[kind];
        return (
          <form
            key={kind}
            action={saveMessageTemplateAction}
            className="flex flex-col gap-3 card p-5"
          >
            <input type="hidden" name="kind" value={kind} />
            <div>
              <h2 className="text-sm font-semibold">{meta.title}</h2>
              <p className="text-xs text-faint">{meta.description}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Subject</label>
              <input
                name="subject"
                defaultValue={t?.subject ?? ""}
                placeholder={`e.g. Appointment confirmed — {clinic_name}`}
                className="w-full input-base"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Message</label>
              <textarea
                name="body"
                rows={6}
                defaultValue={t?.body ?? ""}
                className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm outline-none placeholder:text-faint focus:border-ring"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={t?.isActive ?? true}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Use this template
              </label>
              <button className="btn-primary">
                Save
              </button>
            </div>
          </form>
        );
      })}
    </div>
  );
}
