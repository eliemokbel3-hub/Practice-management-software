// A subtle, professional logo watermark that sits behind page content. Fixed
// to the bottom-right, very low opacity, and non-interactive — it shows
// through the transparent gaps around the opaque content cards, like a
// letterhead. Renders nothing when the clinic has no logo.

export function LogoWatermark({ logo }: { logo: string | null }) {
  if (!logo) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt=""
        draggable={false}
        className="absolute -bottom-6 -right-10 w-[min(50vw,660px)] max-w-none select-none object-contain opacity-[0.05] dark:opacity-[0.075]"
      />
    </div>
  );
}
