"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateClinic } from "@/lib/data/clinic";

export async function updateClinicAction(form: FormData) {
  const str = (key: string) => String(form.get(key) ?? "").trim() || null;
  const name = str("name");
  if (!name) throw new Error("Clinic name is required");
  const gstPercent = Number(form.get("gstRatePercent"));
  await updateClinic({
    name,
    phone: str("phone"),
    email: str("email"),
    abn: str("abn"),
    address: str("address"),
    suburb: str("suburb"),
    state: str("state"),
    postcode: str("postcode"),
    gstRate: Number.isFinite(gstPercent) ? gstPercent / 100 : 0.1,
    invoiceTitle: str("invoiceTitle") ?? "Tax Invoice",
  });
  revalidatePath("/settings/clinic");
  redirect("/settings");
}
