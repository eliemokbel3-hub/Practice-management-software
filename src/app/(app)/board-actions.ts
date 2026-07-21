"use server";

import { revalidatePath } from "next/cache";
import {
  createBoardPost,
  deleteBoardPost,
  setBoardPostPinned,
} from "@/lib/data/board";

export async function createBoardPostAction(form: FormData) {
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  await createBoardPost(body, form.get("pinned") === "on");
  revalidatePath("/");
}

export async function deleteBoardPostAction(id: string) {
  await deleteBoardPost(id);
  revalidatePath("/");
}

export async function toggleBoardPinAction(id: string, pinned: boolean) {
  await setBoardPostPinned(id, pinned);
  revalidatePath("/");
}
