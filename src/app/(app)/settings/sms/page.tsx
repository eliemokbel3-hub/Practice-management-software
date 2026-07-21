import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";

export default function SmsSettingsPage() {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">SMS settings</h1>
        <p className="mt-1 text-sm text-muted">
          Text-message confirmations and reminders.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-warning-soft p-5 text-warning-soft-foreground">
        <MessageSquareText size={18} className="mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium">SMS is coming, and it&apos;s opt-in.</p>
          <p className="mt-1">
            Email confirmations and reminders already work today at no cost. SMS
            costs money per message, so it&apos;s added deliberately: it needs an
            Australian sending account (e.g. ClickSend) connected first. Once
            that&apos;s set up, you&apos;ll choose here which messages also go by
            text and edit their wording under Message templates.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Send appointment texts</p>
            <p className="text-xs text-faint">
              Available once an SMS account is connected.
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-faint">
            Not connected
          </span>
        </div>
      </div>
    </div>
  );
}
