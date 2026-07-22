"use server";

import { revalidatePath } from "next/cache";
import { updateBranding } from "@/lib/data/clinic";
import { normalizeHex } from "@/lib/branding";

function safeLogo(logo: string | null): string | null {
  // Only accept a re-encoded raster data URL (never raw SVG), within size.
  return typeof logo === "string" &&
    /^data:image\/(png|webp|jpeg);base64,/.test(logo) &&
    logo.length < 400_000
    ? logo
    : null;
}

export async function saveBrandingAction(
  logo: string | null,
  logoDark: string | null,
  brandColor: string | null
): Promise<void> {
  const safeColor = brandColor ? normalizeHex(brandColor) : null;
  await updateBranding(safeLogo(logo), safeLogo(logoDark), safeColor);
  revalidatePath("/", "layout");
}
