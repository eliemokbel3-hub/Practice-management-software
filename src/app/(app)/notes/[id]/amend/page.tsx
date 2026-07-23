import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NoteEditor } from "@/components/note-editor";
import { getNote } from "@/lib/data/clinical-notes";

export default async function AmendNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();
  if (note.status !== "final") redirect(`/notes/${id}`);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href={`/notes/${note.id}`}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to note
        </Link>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
          Amend treatment note
        </h1>
        <p className="mt-1 text-sm text-muted">
          {note.patientName} — the current version is kept on record when you
          save.
        </p>
      </div>
      <NoteEditor
        noteId={note.id}
        sections={note.content.sections}
        initialAnswers={note.content.answers}
        mode="amend"
      />
    </div>
  );
}
