"use server";

import { revalidatePath } from "next/cache";
import { saveWorkingHours } from "@/lib/data/schedule";

export async function saveScheduleAction(form: FormData) {
  const days: { weekday: number; startTime: string; endTime: string }[] = [];
  for (let weekday = 0; weekday <= 6; weekday++) {
    if (form.get(`enabled-${weekday}`) !== "on") continue;
    const startTime = String(form.get(`start-${weekday}`) ?? "");
    const endTime = String(form.get(`end-${weekday}`) ?? "");
    if (!startTime || !endTime || endTime <= startTime) {
      throw new Error("End time must be after start time on every working day.");
    }
    days.push({ weekday, startTime, endTime });
  }
  await saveWorkingHours(days);
  revalidatePath("/settings/schedule");
  revalidatePath("/calendar");
}
