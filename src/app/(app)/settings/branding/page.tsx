import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBranding } from "@/lib/data/clinic";
import { BrandingForm } from "./branding-form";

export default async function BrandingPage() {
  const { logo, logoDark, brandColor } = await getBranding();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Branding &amp; logo</h1>
        <p className="mt-1 text-sm text-muted">
          Upload your logo and we&apos;ll build a matching theme automatically —
          in light and dark mode. Change it any time.
        </p>
      </div>
      <BrandingForm
        initialLogo={logo}
        initialLogoDark={logoDark}
        initialColor={brandColor}
      />
    </div>
  );
}
