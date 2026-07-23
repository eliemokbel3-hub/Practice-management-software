"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email or password doesn't match. Please try again."
          : error.message
      );
      setBusy(false);
      return;
    }
    router.push("/patients");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* ambient brand orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-24 h-[24rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)] blur-2xl"
      />
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="animate-fade-up mb-8 flex flex-col items-center gap-4">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground shadow-md"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Activity size={28} strokeWidth={2.5} />
        </span>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">PracticeHub</h1>
          <p className="text-sm text-muted">
            Practice management for osteopaths &amp; allied health
          </p>
        </div>
      </div>
      <div className="card animate-fade-up-delayed w-full max-w-sm p-7 shadow-lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com.au"
              className="input-base"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary py-2.5">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
