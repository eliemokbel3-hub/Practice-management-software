import Link from "next/link";
import { MessageSquare, Send, UserPlus } from "lucide-react";
import { getConversation, listClinicMembers } from "@/lib/data/messages";
import { sendMessageAction } from "./actions";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  })} · ${d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const { with: withId } = await searchParams;
  const members = await listClinicMembers();
  const partner = members.find((m) => m.id === withId) ?? null;
  const conversation = partner ? await getConversation(partner.id) : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted">
          Private messages between accounts linked to your clinic.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <div className="flex h-fit flex-col gap-1 card p-2">
          {members.map((m) => (
            <Link
              key={m.id}
              href={`/messages?with=${m.id}`}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                partner?.id === m.id
                  ? "bg-primary-soft font-medium text-primary-soft-foreground"
                  : "hover:bg-surface-hover"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">
                  {m.name}
                  {m.isSelf && (
                    <span className="text-faint"> (you)</span>
                  )}
                </span>
                {m.title && (
                  <span className="block truncate text-xs text-faint">
                    {m.title}
                  </span>
                )}
              </span>
              {m.unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {m.unread}
                </span>
              )}
            </Link>
          ))}
          <p className="flex items-start gap-2 px-3 py-2 text-xs text-faint">
            <UserPlus size={13} className="mt-0.5 shrink-0" />
            Teammates appear here when their accounts join your clinic.
          </p>
        </div>

        {partner && conversation ? (
          <div className="flex flex-col card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium">
                {partner.name}
                {partner.isSelf && (
                  <span className="font-normal text-faint">
                    {" "}
                    — notes to yourself
                  </span>
                )}
              </p>
            </div>
            <div className="flex max-h-[50vh] min-h-48 flex-col gap-2 overflow-y-auto p-4">
              {conversation.length === 0 ? (
                <p className="m-auto text-sm text-faint">
                  No messages yet — say hello!
                </p>
              ) : (
                conversation.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm ${
                      m.mine && !partner.isSelf
                        ? "self-end bg-primary text-primary-foreground"
                        : "self-start bg-surface-hover"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        m.mine && !partner.isSelf
                          ? "text-primary-foreground/70"
                          : "text-faint"
                      }`}
                    >
                      {formatWhen(m.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <form
              action={sendMessageAction.bind(null, partner.id)}
              className="flex items-end gap-2 border-t border-border p-3"
            >
              <textarea
                name="body"
                required
                rows={2}
                placeholder="Write a message…"
                className="min-h-10 flex-1 resize-y input-base"
              />
              <button
                className="flex items-center gap-1.5 btn-primary"
                aria-label="Send message"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 card p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
              <MessageSquare size={22} />
            </span>
            <p className="text-sm text-muted">
              Choose someone on the left to start a conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
