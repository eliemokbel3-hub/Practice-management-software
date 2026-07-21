// Clinic messaging: simple messages between accounts linked to the clinic.
// RLS keeps everything inside the clinic.

import { createClient, getCurrentProfile } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ClinicMember {
  id: string;
  name: string;
  title: string | null;
  isSelf: boolean;
  unread: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export async function listClinicMembers(): Promise<ClinicMember[]> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const [{ data: members, error }, { data: unread }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, title, is_active")
      .eq("is_active", true)
      .order("first_name"),
    supabase
      .from("messages")
      .select("sender_id")
      .eq("recipient_id", profile.id)
      .is("read_at", null),
  ]);
  if (error) throw new Error(`Couldn't load your clinic team: ${error.message}`);
  const unreadBySender = new Map<string, number>();
  for (const m of unread ?? []) {
    unreadBySender.set(m.sender_id, (unreadBySender.get(m.sender_id) ?? 0) + 1);
  }
  return (members ?? []).map((m: any) => ({
    id: m.id,
    name: `${m.first_name} ${m.last_name}`,
    title: m.title,
    isSelf: m.id === profile.id,
    unread: unreadBySender.get(m.id) ?? 0,
  }));
}

/**
 * The two-way thread with one clinic member. Also marks their messages to
 * you as read — opening the conversation is what "reading" means here.
 */
export async function getConversation(partnerId: string): Promise<ChatMessage[]> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(
      `and(sender_id.eq.${profile.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${profile.id})`
    )
    .order("created_at")
    .limit(200);
  if (error) throw new Error(`Couldn't load messages: ${error.message}`);

  if (partnerId !== profile.id) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", profile.id)
      .eq("sender_id", partnerId)
      .is("read_at", null);
  }

  return (data ?? []).map((m: any) => ({
    id: m.id,
    senderId: m.sender_id,
    body: m.body,
    createdAt: m.created_at,
    mine: m.sender_id === profile.id,
  }));
}

export interface RecentMessage {
  id: string;
  partnerId: string;
  partnerName: string;
  body: string;
  createdAt: string;
  unread: boolean;
}

/**
 * The latest message in each conversation the current user is part of,
 * newest first — for the dashboard's "Recent messages" panel.
 */
export async function listRecentMessages(limit = 6): Promise<RecentMessage[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, sender_id, recipient_id, body, created_at, read_at, sender:profiles!messages_sender_id_fkey(first_name, last_name), recipient:profiles!messages_recipient_id_fkey(first_name, last_name)"
    )
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Couldn't load messages: ${error.message}`);

  const seen = new Set<string>();
  const out: RecentMessage[] = [];
  for (const m of (data ?? []) as any[]) {
    const incoming = m.recipient_id === profile.id;
    const partnerId = incoming ? m.sender_id : m.recipient_id;
    if (partnerId === profile.id || seen.has(partnerId)) continue;
    seen.add(partnerId);
    const who = incoming ? m.sender : m.recipient;
    out.push({
      id: m.id,
      partnerId,
      partnerName: who ? `${who.first_name} ${who.last_name}` : "Someone",
      body: incoming ? m.body : `You: ${m.body}`,
      createdAt: m.created_at,
      unread: incoming && !m.read_at,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export async function sendMessage(
  recipientId: string,
  body: string
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    clinic_id: profile.clinic_id,
    sender_id: profile.id,
    recipient_id: recipientId,
    body,
    // A note to yourself starts read.
    read_at: recipientId === profile.id ? new Date().toISOString() : null,
  });
  if (error) throw new Error(`Couldn't send the message: ${error.message}`);
}
