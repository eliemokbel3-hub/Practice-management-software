import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Database, Mail, Sparkles } from "lucide-react";
import { emailIsConfigured } from "@/lib/email/resend";
import { aiIsConfigured } from "@/lib/ai/tidy-note";

export default function IntegrationsPage() {
  const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const items = [
    {
      icon: Database,
      name: "Supabase (database & logins)",
      connected: supabaseReady,
      note: "Your Australian-hosted database and authentication.",
      how: "Configured — this is the app's core data store.",
    },
    {
      icon: Mail,
      name: "Resend (email)",
      connected: emailIsConfigured(),
      note: "Sends confirmations, reminders and cancellation emails.",
      how: "Add a RESEND_API_KEY to enable. Bookings still work without it.",
    },
    {
      icon: Sparkles,
      name: "Anthropic (AI assist)",
      connected: aiIsConfigured(),
      note: "Powers the “tidy this note” assist.",
      how: "Add an ANTHROPIC_API_KEY to enable the AI features.",
    },
  ];

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted">
          The outside services PracticeHub connects to, and whether each is set
          up on this installation.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {items.map(({ icon: Icon, name, connected, note, how }) => (
          <div
            key={name}
            className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
              <Icon size={18} />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{name}</p>
                {connected ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle2 size={13} /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-faint">
                    <Circle size={13} /> Not connected
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">{note}</p>
              {!connected && <p className="mt-1 text-xs text-faint">{how}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
