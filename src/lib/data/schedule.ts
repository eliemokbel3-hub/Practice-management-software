import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import type { BlockedTime, WorkingHours } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function listWorkingHours(): Promise<WorkingHours[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("working_hours")
    .select("*")
    .order("weekday");
  if (error) throw new Error(`Couldn't load working hours: ${error.message}`);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    practitionerId: row.practitioner_id,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
  }));
}

/** Replace the signed-in practitioner's whole weekly schedule. */
export async function saveWorkingHours(
  days: { weekday: number; startTime: string; endTime: string }[]
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { error: delError } = await supabase
    .from("working_hours")
    .delete()
    .eq("practitioner_id", profile.id);
  if (delError) throw new Error(`Couldn't update schedule: ${delError.message}`);
  if (days.length === 0) return;
  const { error } = await supabase.from("working_hours").insert(
    days.map((d) => ({
      clinic_id: profile.clinic_id,
      practitioner_id: profile.id,
      weekday: d.weekday,
      start_time: d.startTime,
      end_time: d.endTime,
    }))
  );
  if (error) throw new Error(`Couldn't update schedule: ${error.message}`);
}

export async function listBlockedTimesInRange(
  startIso: string,
  endIso: string
): Promise<BlockedTime[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocked_times")
    .select("*")
    .gte("starts_at", startIso)
    .lt("starts_at", endIso)
    .order("starts_at");
  if (error) throw new Error(`Couldn't load blocked times: ${error.message}`);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    practitionerId: row.practitioner_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
  }));
}

export async function createBlockedTime(
  startsAt: Date,
  endsAt: Date,
  reason: string | null
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Your login isn't linked to a clinic yet.");
  const supabase = await createClient();
  const { error } = await supabase.from("blocked_times").insert({
    clinic_id: profile.clinic_id,
    practitioner_id: profile.id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason,
  });
  if (error) throw new Error(`Couldn't block time: ${error.message}`);
}

export async function deleteBlockedTime(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("blocked_times").delete().eq("id", id);
  if (error) throw new Error(`Couldn't remove blocked time: ${error.message}`);
}
