import Link from "next/link";
import { Activity } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-surface px-4 py-5 md:flex">
        <Link href="/patients" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity size={18} strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            PracticeHub
          </span>
        </Link>
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-lg bg-warning-soft px-3 py-2 text-xs font-medium text-warning-soft-foreground">
            Demo mode — sample data only
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-faint">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col md:pl-60">
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
