// A subtle, professional logo watermark centered behind page content. Fixed
// and non-interactive, at very low opacity — it shows through the gaps around
// the opaque content cards, like a letterhead. Swaps to the dark-background
// logo in dark mode; renders nothing when the clinic has no logo.

export function LogoWatermark({
  logo,
  logoDark,
  offsetSidebar = false,
}: {
  logo: string | null;
  logoDark: string | null;
  offsetSidebar?: boolean;
}) {
  if (!logo && !logoDark) return null;
  const light = logo ?? logoDark!;
  const dark = logoDark ?? logo!;
  const single = light === dark;
  const imgBase =
    "w-[min(60vw,540px)] max-w-none select-none object-contain";

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden print:hidden ${
        offsetSidebar ? "md:pl-60" : ""
      }`}
    >
      {single ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={light}
          alt=""
          className={`${imgBase} opacity-[0.05] dark:opacity-[0.08]`}
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={light}
            alt=""
            className={`${imgBase} opacity-[0.06] dark:hidden`}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dark}
            alt=""
            className={`${imgBase} hidden opacity-[0.09] dark:block`}
          />
        </>
      )}
    </div>
  );
}
