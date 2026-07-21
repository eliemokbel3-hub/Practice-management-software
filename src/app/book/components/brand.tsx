import { brandThemeCss } from "@/lib/branding";

/** Injects a clinic's brand theme on a public page. */
export function BrandStyle({ brandColor }: { brandColor: string | null }) {
  const css = brandThemeCss(brandColor);
  return css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null;
}

/** A clinic logo above a public page's heading, if one is set. */
export function BrandLogo({
  logo,
  name,
}: {
  logo: string | null;
  name: string;
}) {
  if (!logo) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={name}
      className="mb-4 max-h-16 max-w-[220px] object-contain"
    />
  );
}
