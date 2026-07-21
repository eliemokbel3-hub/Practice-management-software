"use client";

// Add a team member. On success it shows the temporary password once so the
// owner can pass it on — the password is never placed in the URL or logged.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, UserPlus } from "lucide-react";
import { createStaffAction } from "./actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring";

export function AddStaffForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const result = await createStaffAction({
      firstName: String(form.get("firstName") ?? "").trim(),
      lastName: String(form.get("lastName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      title: String(form.get("title") ?? "").trim() || null,
      role: String(form.get("role") ?? "practitioner") as
        | "owner"
        | "practitioner"
        | "reception",
      ahpraNumber: String(form.get("ahpraNumber") ?? "").trim() || null,
      password: String(form.get("password") ?? "").trim() || null,
    });
    setBusy(false);
    if (result.ok) {
      setCreated({
        email: String(form.get("email") ?? "").trim(),
        password: result.tempPassword!,
      });
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't add the team member.");
    }
  }

  if (created) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary-soft/30 p-5">
        <p className="text-sm font-medium">Team member added.</p>
        <p className="text-sm text-muted">
          Share these sign-in details securely — the password won&apos;t be shown
          again. They can change it after signing in.
        </p>
        <div className="rounded-lg border border-border bg-surface p-3 text-sm">
          <p>
            <span className="text-faint">Email:</span> {created.email}
          </p>
          <p className="mt-1 flex items-center gap-2">
            <span className="text-faint">Temporary password:</span>
            <code className="rounded bg-surface-hover px-1.5 py-0.5 font-mono">
              {created.password}
            </code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(created.password);
                setCopied(true);
              }}
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs transition-colors hover:bg-surface-hover"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </p>
        </div>
        <button
          onClick={() => {
            setCreated(null);
            setCopied(false);
          }}
          className="self-start rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
        >
          Done
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        <UserPlus size={15} /> Add team member
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
    >
      <h2 className="text-sm font-semibold">New team member</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="firstName" required placeholder="First name" className={inputCls} />
        <input name="lastName" required placeholder="Last name" className={inputCls} />
        <input
          name="email"
          type="email"
          required
          placeholder="Email (their login)"
          className={inputCls}
        />
        <input name="title" placeholder="Title, e.g. Osteopath" className={inputCls} />
        <select name="role" defaultValue="practitioner" className={inputCls}>
          <option value="practitioner">Practitioner</option>
          <option value="reception">Reception</option>
          <option value="owner">Owner</option>
        </select>
        <input name="ahpraNumber" placeholder="AHPRA number (optional)" className={inputCls} />
        <div className="sm:col-span-2">
          <input
            name="password"
            placeholder="Temporary password (leave blank to auto-generate)"
            className={inputCls}
          />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" />}
          Create login
        </button>
      </div>
    </form>
  );
}
