"use client";

// Facebook-style chat dock, fixed in the bottom-right on every app screen.
// A launcher shows the total unread count; clicking it lists clinic
// teammates; clicking a teammate opens a small chat window. Windows poll for
// new messages, and an incoming message from someone auto-opens their window.

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, MessageCircle, Send, X } from "lucide-react";
import {
  fetchChatStateAction,
  fetchConversationAction,
  sendChatMessageAction,
} from "@/app/(app)/chat-actions";
import type { ChatMessage, ClinicMember } from "@/lib/data/messages";

const STATE_POLL_MS = 10_000;
const CONVO_POLL_MS = 5_000;
const MAX_OPEN = 3;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatDock() {
  const [meId, setMeId] = useState<string | null>(null);
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [open, setOpen] = useState<string[]>([]); // partnerIds, newest last
  const [minimized, setMinimized] = useState<Set<string>>(new Set());
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Snapshots for the poll loop to compare against, synced after each render.
  const membersRef = useRef<ClinicMember[]>([]);
  const openRef = useRef<string[]>([]);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const totalUnread = members.reduce((sum, m) => sum + m.unread, 0);

  const loadConversation = useCallback(async (partnerId: string) => {
    try {
      const msgs = await fetchConversationAction(partnerId);
      setThreads((prev) => ({ ...prev, [partnerId]: msgs }));
    } catch {
      // Ignore transient polling errors.
    }
  }, []);

  const openChat = useCallback(
    (partnerId: string) => {
      setListOpen(false);
      setMinimized((prev) => {
        const next = new Set(prev);
        next.delete(partnerId);
        return next;
      });
      setOpen((prev) => {
        if (prev.includes(partnerId)) return prev;
        const next = [...prev, partnerId];
        return next.slice(-MAX_OPEN);
      });
      // Optimistically clear the unread badge for this person.
      setMembers((prev) =>
        prev.map((m) => (m.id === partnerId ? { ...m, unread: 0 } : m))
      );
      loadConversation(partnerId);
    },
    [loadConversation]
  );

  const closeChat = useCallback((partnerId: string) => {
    setOpen((prev) => prev.filter((id) => id !== partnerId));
  }, []);

  // Poll the roster + unread counts; auto-open a window when someone new
  // messages us.
  useEffect(() => {
    let active = true;
    async function poll() {
      const state = await fetchChatStateAction();
      if (!active || !state) return;
      const prev = membersRef.current;
      setMeId(state.meId);
      setMembers(state.members);
      for (const m of state.members) {
        const before = prev.find((p) => p.id === m.id);
        const gained = m.unread > (before?.unread ?? 0);
        if (gained && !openRef.current.includes(m.id) && !m.isSelf) {
          openChat(m.id);
        }
      }
    }
    poll();
    const timer = setInterval(poll, STATE_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [openChat]);

  // Poll open (non-minimised) conversations for new messages.
  useEffect(() => {
    const live = open.filter((id) => !minimized.has(id));
    if (live.length === 0) return;
    const timer = setInterval(() => {
      for (const id of live) loadConversation(id);
    }, CONVO_POLL_MS);
    return () => clearInterval(timer);
  }, [open, minimized, loadConversation]);

  async function handleSend(partnerId: string) {
    const body = (drafts[partnerId] ?? "").trim();
    if (!body) return;
    setDrafts((prev) => ({ ...prev, [partnerId]: "" }));
    const result = await sendChatMessageAction(partnerId, body);
    if (result.ok && result.messages) {
      setThreads((prev) => ({ ...prev, [partnerId]: result.messages! }));
    }
  }

  const memberById = (id: string) => members.find((m) => m.id === id);

  return (
    <div className="fixed bottom-0 right-0 z-40 flex items-end gap-3 p-4 print:hidden">
      {/* Open chat windows */}
      {open.map((partnerId) => {
        const member = memberById(partnerId);
        if (!member) return null;
        const isMin = minimized.has(partnerId);
        const msgs = threads[partnerId] ?? [];
        return (
          <div
            key={partnerId}
            className="flex w-72 flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
              <button
                onClick={() =>
                  setMinimized((prev) => {
                    const next = new Set(prev);
                    if (next.has(partnerId)) next.delete(partnerId);
                    else next.add(partnerId);
                    return next;
                  })
                }
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
                  {initials(member.name)}
                </span>
                <span className="truncate text-sm font-medium">
                  {member.name}
                  {member.isSelf && (
                    <span className="font-normal text-faint"> (you)</span>
                  )}
                </span>
                {member.unread > 0 && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
              <div className="flex items-center">
                <button
                  onClick={() =>
                    setMinimized((prev) => {
                      const next = new Set(prev);
                      if (next.has(partnerId)) next.delete(partnerId);
                      else next.add(partnerId);
                      return next;
                    })
                  }
                  aria-label={isMin ? "Expand" : "Minimise"}
                  className="rounded p-1 text-faint transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <ChevronDown
                    size={16}
                    className={isMin ? "rotate-180" : ""}
                  />
                </button>
                <button
                  onClick={() => closeChat(partnerId)}
                  aria-label="Close"
                  className="rounded p-1 text-faint transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMin && (
              <>
                <div className="flex h-64 flex-col gap-1.5 overflow-y-auto bg-background px-3 py-3">
                  {msgs.length === 0 ? (
                    <p className="m-auto text-xs text-faint">
                      No messages yet — say hello!
                    </p>
                  ) : (
                    msgs.map((m) => (
                      <div
                        key={m.id}
                        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                          m.mine && !member.isSelf
                            ? "self-end rounded-br-sm bg-primary text-primary-foreground"
                            : "self-start rounded-bl-sm bg-surface-hover"
                        }`}
                        title={timeLabel(m.createdAt)}
                      >
                        {m.body}
                      </div>
                    ))
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(partnerId);
                  }}
                  className="flex items-center gap-2 border-t border-border p-2"
                >
                  <input
                    value={drafts[partnerId] ?? ""}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [partnerId]: e.target.value,
                      }))
                    }
                    placeholder="Aa"
                    className="min-w-0 flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
                  />
                  <button
                    type="submit"
                    aria-label="Send"
                    className="rounded-full p-2 text-primary transition-colors hover:bg-primary-soft"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        );
      })}

      {/* Contacts + launcher column */}
      <div className="flex flex-col items-end gap-3">
        {listOpen && (
          <div className="w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Clinic chat</p>
              <p className="text-xs text-faint">Message your team</p>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {members.length === 0 ? (
                <p className="px-3 py-4 text-sm text-faint">
                  Loading your team…
                </p>
              ) : (
                members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => openChat(m.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
                      {initials(m.name)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {m.name}
                      {m.isSelf && (
                        <span className="text-faint"> (you)</span>
                      )}
                    </span>
                    {m.unread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                        {m.unread}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {meId && (
          <button
            onClick={() => setListOpen((v) => !v)}
            aria-label="Clinic chat"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            {listOpen ? <ChevronDown size={22} /> : <MessageCircle size={22} />}
            {!listOpen && totalUnread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-white">
                {totalUnread}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
