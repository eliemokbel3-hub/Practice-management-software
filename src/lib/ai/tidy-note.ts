import Anthropic from "@anthropic-ai/sdk";
import { execFileSync } from "child_process";
import type { NoteContent } from "@/lib/types";

/**
 * Resolve the Anthropic API key. In production it's a normal env var; in local
 * dev on Windows we also check the user's registry-stored environment, because
 * the dev server may have started before `setx` ran. The key value is never
 * logged or returned to the client.
 */
function getApiKey(): string | null {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  if (process.platform === "win32") {
    try {
      const out = execFileSync(
        "reg",
        ["query", "HKCU\\Environment", "/v", "ANTHROPIC_API_KEY"],
        { encoding: "utf8" }
      );
      const match = out.match(/ANTHROPIC_API_KEY\s+REG_(?:EXPAND_)?SZ\s+(.+)/);
      if (match) return match[1].trim();
    } catch {
      // Not set — handled by the caller with a friendly message.
    }
  }
  return null;
}

/** Whether the AI features have an API key available on this server. */
export function aiIsConfigured(): boolean {
  return getApiKey() !== null;
}

const SYSTEM_PROMPT = `You tidy rough clinical shorthand written by an allied-health practitioner into clear, well-organised treatment-note text.

Rules:
- NEVER invent, add, or embellish clinical findings, measurements, diagnoses, treatments, or advice. Only rephrase, complete half-typed words, fix spelling, and organise what is already written.
- Keep standard clinical abbreviations (e.g. L4/5, ROM, NAD, Rx) as written.
- Where a field contains pre-filled label lines (e.g. "Site - ", "Chron - "), keep those labels and tidy the text after each one. Leave labels with nothing after them untouched.
- Match the practitioner's concise clinical style — clean and readable, not padded into prose.
- If a field is empty, or contains only unfilled prompt labels, return it exactly unchanged.
- Return EVERY text field you were given, using its exact key.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          text: { type: "string" },
        },
        required: ["key", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["fields"],
  additionalProperties: false,
} as const;

export interface TidyResult {
  answers?: Record<string, string>;
  error?: string;
}

export async function tidyNoteContent(
  content: NoteContent,
  answers: Record<string, string | boolean>
): Promise<TidyResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      error:
        "AI assist isn't set up yet — the Anthropic API key hasn't been added on this computer.",
    };
  }

  // Only text fields go to the model; checkboxes and empty keys stay untouched.
  const fields = content.sections.flatMap((section) =>
    section.questions
      .filter((q) => q.type !== "checkbox")
      .map((q) => ({
        key: `${section.key}.${q.key}`,
        section: section.label,
        label: q.label,
        text: String(answers[`${section.key}.${q.key}`] ?? ""),
      }))
  );

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Tidy these treatment note fields:\n\n${JSON.stringify(fields, null, 2)}`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return { error: "The AI didn't return a usable result. Try again." };
    }
    const parsed = JSON.parse(text.text) as {
      fields: { key: string; text: string }[];
    };

    const validKeys = new Set(fields.map((f) => f.key));
    const result: Record<string, string> = {};
    for (const f of parsed.fields) {
      if (validKeys.has(f.key)) result[f.key] = f.text;
    }
    return { answers: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { error: `Couldn't tidy the note: ${message}` };
  }
}
