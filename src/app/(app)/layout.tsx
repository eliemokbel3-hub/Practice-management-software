import Link from "next/link";
import { Activity, LogOut } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { ChatDock } from "@/components/chat-dock";
import { LogoWatermark } from "@/components/logo-watermark";
import { ThemedLogo } from "@/components/themed-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getBranding } from "@/lib/data/clinic";
import { brandThemeCss } from "@/lib/branding";
import { signOutAction } from "./sign-out-action";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, branding] = await Promise.all([
    getCurrentProfile(),
    getBranding(),
  ]);
  const brandCss = brandThemeCss(branding.brandColor);

  return (
    <div className="flex min-h-screen">
      {brandCss && <style dangerouslySetInnerHTML={{ __html: brandCss }} />}
      <LogoWatermark
        logo={branding.logo}
        logoDark={branding.logoDark}
        offsetSidebar
      />
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-surface px-4 py-5 md:flex print:hidden">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          {branding.logo || branding.logoDark ? (
            <ThemedLogo
              logo={branding.logo}
              logoDark={branding.logoDark}
              name={branding.name}
              className="max-h-10 max-w-[168px] object-contain"
            />
          ) : (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity size={18} strokeWidth={2.5} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                PracticeHub
              </span>
            </>
          )}
        </Link>
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-faint">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <div className="min-w-0 px-1">
              <p className="truncate text-sm font-medium">
                {profile ? `${profile.first_name} ${profile.last_name}` : "Signed in"}
              </p>
              {profile?.title && (
                <p className="truncate text-xs text-faint">{profile.title}</p>
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
      <div className="flex flex-1 flex-col md:pl-60 print:pl-0">
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-10">
          {children}
        </main>
      </div>
      <ChatDock />
    </div>
  );
}
