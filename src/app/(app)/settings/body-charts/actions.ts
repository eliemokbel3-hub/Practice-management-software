"use server";

import { revalidatePath } from "next/cache";
import {
  createBodyChart,
  deleteBodyChart,
  setBodyChartActive,
} from "@/lib/data/templates";

const path = "/settings/body-charts";

export async function createBodyChartAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const region = String(form.get("region") ?? "full_body");
  await createBodyChart(name, region);
  revalidatePath(path);
}
export async function toggleBodyChartAction(id: string, active: boolean) {
  await setBodyChartActive(id, active);
  revalidatePath(path);
}
export async function deleteBodyChartAction(id: string) {
  await deleteBodyChart(id);
  revalidatePath(path);
}
