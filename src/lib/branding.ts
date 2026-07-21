// Turns a single brand colour (hex) into a full light + dark theme, matching
// the structure of the default teal theme in globals.css. Pure functions —
// used both on the server (to inject CSS) and on the client (live preview).

/* ---- colour maths ---- */

export function normalizeHex(input: string): string | null {
  let h = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h.toLowerCase()}` : null;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function rgbToHsl(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function hexToHsl(hex: string): [number, number, number] {
  return rgbToHsl(...hexToRgb(hex));
}

/** Relative luminance (0 dark – 1 light), for choosing readable text. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export interface ThemeVars {
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  primarySoft: string;
  primarySoftForeground: string;
  ring: string;
}

export interface DerivedTheme {
  light: ThemeVars;
  dark: ThemeVars;
}

/**
 * Build usable light + dark accent palettes from a brand colour. The hue is
 * kept; saturation and lightness are normalised so buttons stay legible no
 * matter how light, dark or vivid the source colour is.
 */
export function deriveTheme(hex: string): DerivedTheme {
  const [h, s0] = hexToHsl(hex);
  // Guarantee a little saturation so greyscale logos still read as a tint.
  const s = clamp(s0, 0.28, 0.9);

  const lightPrimary = hslToHex(h, s, 0.42);
  const darkPrimary = hslToHex(h, clamp(s + 0.05, 0, 0.85), 0.62);

  return {
    light: {
      primary: lightPrimary,
      primaryHover: hslToHex(h, s, 0.34),
      primaryForeground:
        luminance(lightPrimary) > 0.55 ? hslToHex(h, s, 0.14) : "#ffffff",
      primarySoft: hslToHex(h, clamp(s * 0.7, 0, 0.6), 0.92),
      primarySoftForeground: hslToHex(h, s, 0.3),
      ring: lightPrimary,
    },
    dark: {
      primary: darkPrimary,
      primaryHover: hslToHex(h, s, 0.74),
      primaryForeground:
        luminance(darkPrimary) > 0.55 ? hslToHex(h, s, 0.12) : "#ffffff",
      primarySoft: hslToHex(h, clamp(s * 0.55, 0, 0.5), 0.2),
      primarySoftForeground: hslToHex(h, s, 0.76),
      ring: darkPrimary,
    },
  };
}

function block(selector: string, v: ThemeVars): string {
  return (
    `${selector}{` +
    `--primary:${v.primary};` +
    `--primary-hover:${v.primaryHover};` +
    `--primary-foreground:${v.primaryForeground};` +
    `--primary-soft:${v.primarySoft};` +
    `--primary-soft-foreground:${v.primarySoftForeground};` +
    `--ring:${v.ring};` +
    `}`
  );
}

/**
 * CSS overriding the brand-driven theme variables for light and dark mode.
 * Injected after globals.css so it wins at equal specificity. Returns "" for
 * a blank/invalid colour, keeping the default theme.
 */
export function brandThemeCss(hex: string | null | undefined): string {
  if (!hex) return "";
  const norm = normalizeHex(hex);
  if (!norm) return "";
  const t = deriveTheme(norm);
  return block(":root", t.light) + block(".dark", t.dark);
}
