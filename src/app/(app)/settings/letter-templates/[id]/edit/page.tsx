import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLetterTemplate } from "@/lib/data/templates";
import { saveLetterAction } from "../../actions";

const PLACEHOLDERS = [
  "{patient_name}",
  "{patient_first_name}",
  "{date_of_birth}",
  "{clinic_name}",
  "{practitioner_name}",
  "{today}",
];

export default async function EditLetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const letter = await getLetterTemplate(id);
  if (!letter) notFound();
  const save = saveLetterAction.bind(null, letter.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/settings/letter-templates"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Letter templates
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Edit letter</h1>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium">Placeholders</p>
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
      </div>

      <form action={save} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Letter name</label>
          <input
            name="name"
            defaultValue={letter.name}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Letter body</label>
          <textarea
            name="body"
            rows={14}
            defaultValue={letter.body}
            placeholder={`Dear Dr Smith,\n\nRe: {patient_name} (DOB {date_of_birth})\n\nThank you for referring…`}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring"
          />
        </div>
        <div className="flex justify-end">
          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
            Save letter
          </button>
        </div>
      </form>
    </div>
  );
}
