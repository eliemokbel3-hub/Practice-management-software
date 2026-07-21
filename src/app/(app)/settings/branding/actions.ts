"use server";

import { revalidatePath } from "next/cache";
import { updateBranding } from "@/lib/data/clinic";
import { normalizeHex } from "@/lib/branding";

export async function saveBrandingAction(
  logo: string | null,
  brandColor: string | null
): Promise<void> {
  // Only accept a re-encoded raster data URL for the logo (never raw SVG),
  // and a valid hex for the colour.
  const safeLogo =
    typeof logo === "string" &&
    /^data:image\/(png|webp|jpeg);base64,/.test(logo) &&
    logo.length < 400_000
      ? logo
      : logo === null
        ? null
        : null;
  const safeColor = brandColor ? normalizeHex(brandColor) : null;
  await updateBranding(safeLogo, safeColor);
  revalidatePath("/", "layout");
}
