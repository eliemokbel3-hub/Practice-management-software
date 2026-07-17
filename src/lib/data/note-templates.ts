import { createClient } from "@/lib/supabase/server";
import type { NoteTemplate } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToTemplate(row: any): NoteTemplate {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    sections: row.sections ?? [],
    isDefault: row.is_default,
    isActive: row.is_active,
  };
}

export async function listNoteTemplates(): Promise<NoteTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("note_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(`Couldn't load note templates: ${error.message}`);
  return (data ?? []).map(rowToTemplate);
}

export async function getNoteTemplate(id: string): Promise<NoteTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("note_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load note template: ${error.message}`);
  return data ? rowToTemplate(data) : null;
}

export async function getDefaultNoteTemplate(): Promise<NoteTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("note_templates")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load note template: ${error.message}`);
  return data ? rowToTemplate(data) : null;
}
