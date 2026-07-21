// Clinic message board — a shared noticeboard for everyone in the clinic.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface BoardPost {
  id: string;
  authorId: string | null;
  authorName: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  mine: boolean;
}

export async function listBoardPosts(limit = 30): Promise<BoardPost[]> {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("board_posts")
    .select("id, author_id, body, pinned, created_at, profiles(first_name, last_name)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Couldn't load the message board: ${error.message}`);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    authorId: row.author_id,
    authorName: row.profiles
      ? `${row.profiles.first_name} ${row.profiles.last_name}`
      : "Someone",
    body: row.body,
    pinned: row.pinned,
    createdAt: row.created_at,
    mine: row.author_id === profile?.id,
  }));
}

export async function createBoardPost(
  body: string,
  pinned: boolean
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { error } = await supabase.from("board_posts").insert({
    clinic_id: profile.clinic_id,
    author_id: profile.id,
    body,
    pinned,
  });
  if (error) throw new Error(`Couldn't post to the board: ${error.message}`);
}

export async function deleteBoardPost(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("board_posts").delete().eq("id", id);
  if (error) throw new Error(`Couldn't remove the post: ${error.message}`);
}

export async function setBoardPostPinned(
  id: string,
  pinned: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_posts")
    .update({ pinned })
    .eq("id", id);
  if (error) throw new Error(`Couldn't update the post: ${error.message}`);
}
