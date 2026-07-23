"use client";

// Mobile app-shell navigation: a fixed top bar below `md` with a hamburger
// that opens a slide-over drawer reusing SidebarNav. Renders nothing at
// desktop widths — the fixed sidebar in the app layout takes over there.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LogOut, Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemedLogo } from "@/components/themed-logo";
import { ThemeToggle } from "@/components/theme-toggle";

interface MobileNavProps {
  branding: { name: string; logo: string | null; logoDark: string | null };
  profileName: string | null;
  profileTitle: string | null;
  signOutAction: () => Promise<void>;
}

function BrandMark({ branding }: { branding: MobileNavProps["branding"] }) {
  return branding.logo || branding.logoDark ? (
    <ThemedLogo
      logo={branding.logo}
      logoDark={branding.logoDark}
      name={branding.name}
      className="max-h-8 max-w-[140px] object-contain"
    />
  ) : (
    <>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg text-primary-foreground shadow-sm"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <Activity size={16} strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        PracticeHub
      </span>
    </>
  );
}

export function MobileNav({
  branding,
  profileName,
  profileTitle,
  signOutAction,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close when navigation happens (state adjustment during render — the
  // React-recommended alternative to a setState-in-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden print:hidden">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark branding={branding} />
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* overlay */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* drawer */}
      <aside
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface px-4 py-5 shadow-lg transition-transform duration-200 motion-reduce:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <BrandMark branding={branding} />
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-faint transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-faint">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <div className="min-w-0 px-1">
              <p className="truncate text-sm font-medium">
                {profileName ?? "Signed in"}
              </p>
              {profileTitle && (
                <p className="truncate text-xs text-faint">{profileTitle}</p>
              )}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="rounded-lg p-2 text-faint transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </div>
  );
}
