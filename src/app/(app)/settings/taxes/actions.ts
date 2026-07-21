"use server";

import { revalidatePath } from "next/cache";
import {
  createTaxRate,
  deleteTaxRate,
  setTaxRateActive,
  setTaxRateDefault,
} from "@/lib/data/lists";

const paths = ["/settings/taxes", "/settings/clinic"];
const bust = () => paths.forEach((p) => revalidatePath(p));

export async function createTaxRateAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const percent = Number(form.get("percent"));
  await createTaxRate(name, Number.isFinite(percent) ? percent / 100 : 0);
  bust();
}
export async function makeTaxDefaultAction(id: string) {
  await setTaxRateDefault(id);
  bust();
}
export async function toggleTaxRateAction(id: string, active: boolean) {
  await setTaxRateActive(id, active);
  bust();
}
export async function deleteTaxRateAction(id: string) {
  await deleteTaxRate(id);
  bust();
}
