"use server";

import { getNote } from "@/lib/data/clinical-notes";
import { tidyNoteContent, type TidyResult } from "@/lib/ai/tidy-note";

export async function tidyNoteAction(
  noteId: string,
  answers: Record<string, string | boolean>
): Promise<TidyResult> {
  const note = await getNote(noteId);
  if (!note) return { error: "Note not found." };
  return tidyNoteContent(note.content, answers);
}
