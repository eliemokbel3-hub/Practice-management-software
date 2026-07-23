import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/server";
import { listBoardPosts } from "@/lib/data/board";
import { listDraftNotes } from "@/lib/data/clinical-notes";
import { listRecentMessages } from "@/lib/data/messages";
import {
  createBoardPostAction,
  deleteBoardPostAction,
  toggleBoardPinAction,
} from "./board-actions";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card card-hover flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <h2 className="section-label">{title}</h2>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

export default async function HomePage() {
  const [profile, posts, drafts, recentMessages] = await Promise.all([
    getCurrentProfile(),
    listBoardPosts(),
    listDraftNotes(),
    listRecentMessages(),
  ]);
  const firstName = profile?.first_name ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <p className="text-[13px] font-medium uppercase tracking-widest text-faint">
          {today}
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold leading-tight tracking-tight">
          {greeting},{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {firstName}
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          What&apos;s happening at the clinic today.
        </p>
      </div>

      {/* Message board */}
      <Panel title="Message board">
        <form action={createBoardPostAction} className="flex flex-col gap-3">
          <textarea
            name="body"
            required
            rows={2}
            placeholder="Post a note for the whole clinic — reminders, updates, anything the team should see."
            className="input-base w-full resize-y"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                name="pinned"
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Pin to top
            </label>
            <button className="btn-primary">Post</button>
          </div>
        </form>

        <div className="mt-5 flex flex-col gap-3">
          {posts.length === 0 ? (
            <p className="text-sm text-faint">
              Nothing on the board yet. Post the first note above.
            </p>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className={`rounded-lg border p-4 ${
                  post.pinned
                    ? "border-primary/40 bg-primary-soft/30"
                    : "border-border bg-background"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{post.authorName}</span>
                    <span className="text-faint">· {timeAgo(post.createdAt)}</span>
                    {post.pinned && (
                      <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-soft-foreground">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <form
                      action={toggleBoardPinAction.bind(
                        null,
                        post.id,
                        !post.pinned
                      )}
                    >
                      <button
                        title={post.pinned ? "Unpin" : "Pin to top"}
                        className="rounded-md p-1.5 text-faint transition-colors hover:bg-surface-hover hover:text-foreground"
                      >
                        {post.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                    </form>
                    {post.mine && (
                      <form action={deleteBoardPostAction.bind(null, post.id)}>
                        <button
                          title="Delete"
                          className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {post.body}
                </p>
              </article>
            ))
          )}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Draft treatment notes */}
        <Panel
          title="Draft treatment notes"
          action={
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-soft-foreground">
              {drafts.length}
            </span>
          }
        >
          {drafts.length === 0 ? (
            <p className="text-sm text-faint">
              No unfinished notes — you&apos;re all caught up.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {drafts.map((n) => (
                <li key={n.id} className="py-2 first:pt-0 last:pb-0">
                  <Link
                    href={`/notes/${n.id}`}
                    className="flex items-center gap-3 text-sm hover:underline"
                  >
                    <FileText size={15} className="shrink-0 text-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {n.patientName ?? "Patient"}
                      </span>
                      <span className="block text-xs text-faint">
                        {n.practitionerName} · updated {timeAgo(n.updatedAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent messages */}
        <Panel
          title="Recent messages"
          action={
            <Link
              href="/messages"
              className="text-xs font-medium text-primary hover:underline"
            >
              Open messages
            </Link>
          }
        >
          {recentMessages.length === 0 ? (
            <p className="text-sm text-faint">
              No messages yet. Start a conversation from the chat in the
              bottom-right corner.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentMessages.map((m) => (
                <li key={m.id} className="py-2 first:pt-0 last:pb-0">
                  <Link
                    href={`/messages?with=${m.partnerId}`}
                    className="flex items-center gap-3 text-sm hover:underline"
                  >
                    <MessageSquare
                      size={15}
                      className={`shrink-0 ${
                        m.unread ? "text-primary" : "text-faint"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate ${
                            m.unread ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {m.partnerName}
                        </span>
                        <span className="shrink-0 text-xs text-faint">
                          {timeAgo(m.createdAt)}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {m.body}
                      </span>
                    </span>
                    {m.unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
