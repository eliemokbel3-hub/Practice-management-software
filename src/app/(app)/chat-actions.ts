"use server";

// JSON server actions behind the Facebook-style chat dock. Unlike the
// full Messages page (which redirects), these return data so the client
// dock can poll and update in place.

import {
  getConversation,
  listClinicMembers,
  sendMessage,
  type ChatMessage,
  type ClinicMember,
} from "@/lib/data/messages";
import { getCurrentProfile } from "@/lib/supabase/server";

export interface ChatState {
  meId: string;
  members: ClinicMember[];
}

export async function fetchChatStateAction(): Promise<ChatState | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const members = await listClinicMembers();
  return { meId: profile.id, members };
}

export async function fetchConversationAction(
  partnerId: string
): Promise<ChatMessage[]> {
  return getConversation(partnerId);
}

export async function sendChatMessageAction(
  partnerId: string,
  body: string
): Promise<{ ok: boolean; messages?: ChatMessage[]; error?: string }> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Empty message." };
  try {
    await sendMessage(partnerId, text);
    const messages = await getConversation(partnerId);
    return { ok: true, messages };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't send the message.",
    };
  }
}
