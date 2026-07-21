"use client";

// Owner-only: reset a team member's password and show the new temporary one
// once, so it can be passed on. The password is never placed in the URL.

import { useState } from "react";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { resetStaffPasswordAction } from "./actions";

export function ResetPasswordButton({
  staffId,
  email,
}: {
  staffId: string;
  email: string;
}) {
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function reset() {
    setBusy(true);
    setError(null);
    const result = await resetStaffPasswordAction(staffId);
    setBusy(false);
    if (result.ok) setPassword(result.tempPassword!);
    else setError(result.error ?? "Couldn't reset the password.");
  }

  if (password) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-primary/40 bg-primary-soft/30 px-3 py-2 text-xs">
        <span className="text-muted">New temporary password for {email}:</span>
        <span className="flex items-center gap-2">
          <code className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-sm">
            {password}
          </code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(password);
              setCopied(true);
            }}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 transition-colors hover:bg-surface-hover"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={reset}
        disabled={busy}
        title="Reset password"
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover disabled:opacity-60"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
        Reset password
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
