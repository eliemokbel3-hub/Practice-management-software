// Renders a clinic logo, swapping to the dark-background version when the app
// is in dark mode. If only one logo is set it's used in both themes. Renders
// nothing when the clinic has no logo at all.

export function ThemedLogo({
  logo,
  logoDark,
  name,
  className,
}: {
  logo: string | null;
  logoDark: string | null;
  name: string;
  className?: string;
}) {
  if (!logo && !logoDark) return null;
  const light = logo ?? logoDark!;
  const dark = logoDark ?? logo!;

  if (light === dark) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={light} alt={name} className={className} draggable={false} />
    );
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light}
        alt={name}
        draggable={false}
        className={`${className ?? ""} dark:hidden`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark}
        alt={name}
        draggable={false}
        className={`${className ?? ""} hidden dark:block`}
      />
    </>
  );
}
