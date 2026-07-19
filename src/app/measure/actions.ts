"use server";

// Server action behind the public questionnaire page. The token is the only
// authorisation; everything else is validated server-side.

import { submitMeasureResponse } from "@/lib/outcomes/public";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function submitMeasureAction(
  token: string,
  answers: any
): Promise<{ ok: boolean; error?: string }> {
  const result = await submitMeasureResponse(token, answers);
  return { ok: result.ok, error: result.error };
}
