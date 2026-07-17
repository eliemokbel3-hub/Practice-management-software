import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Activity size={24} strokeWidth={2.5} />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">PracticeHub</h1>
        <p className="text-sm text-muted">
          Practice management for osteopaths &amp; allied health
        </p>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              disabled
              placeholder="you@clinic.com.au"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              disabled
              placeholder="••••••••"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-ring disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            disabled
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50"
          >
            Sign in
          </button>
        </form>
        <div className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
          Sign-in unlocks once the database is connected. Until then, explore
          the demo with sample data.
        </div>
        <Link
          href="/patients"
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
        >
          Continue in demo mode <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
