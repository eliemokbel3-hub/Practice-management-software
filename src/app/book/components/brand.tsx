import { brandThemeCss } from "@/lib/branding";
import { ThemedLogo } from "@/components/themed-logo";

export { LogoWatermark as BrandWatermark } from "@/components/logo-watermark";

/** Injects a clinic's brand theme on a public page. */
export function BrandStyle({ brandColor }: { brandColor: string | null }) {
  const css = brandThemeCss(brandColor);
  return css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null;
}

/** A clinic logo above a public page's heading, if one is set. */
export function BrandLogo({
  logo,
  logoDark,
  name,
}: {
  logo: string | null;
  logoDark: string | null;
  name: string;
}) {
  if (!logo && !logoDark) return null;
  return (
    <ThemedLogo
      logo={logo}
      logoDark={logoDark}
      name={name}
      className="mb-4 max-h-16 max-w-[220px] object-contain"
    />
  );
}
