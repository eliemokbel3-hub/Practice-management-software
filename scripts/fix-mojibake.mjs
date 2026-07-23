// One-off repair for double-encoded UTF-8 text (mojibake) in Supabase, caused
// by importing a UTF-8 seed file through a Windows-1252 psql session
// (e.g. "—" stored as "â€”"). Re-decodes affected strings by encoding them as
// Windows-1252 and reading the bytes back as UTF-8. Run from the project root:
//   node scripts/fix-mojibake.mjs          (dry run — prints planned changes)
//   node scripts/fix-mojibake.mjs --apply  (writes fixes)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const APPLY = process.argv.includes("--apply");

// Windows-1252 code points for bytes 0x80–0x9F (the rest match Unicode 1:1).
const CP1252_C1 = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84,
  "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c,
  "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93,
  "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b,
  "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

// Mojibake signature: â/Â/Ã followed by a byte-0x80–0xFF character.
const SUSPECT = new RegExp(
  "[ÂÃâ](?:[ -ÿ]|" +
    Object.keys(CP1252_C1).join("|") +
    ")"
);

function fixString(s) {
  if (typeof s !== "string" || !SUSPECT.test(s)) return s;
  const bytes = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xff) bytes.push(cp);
    else if (ch in CP1252_C1) bytes.push(CP1252_C1[ch]);
    else return s; // contains a char with no cp1252 byte — not pure mojibake
  }
  const decoded = Buffer.from(bytes).toString("utf8");
  return decoded.includes("�") ? s : decoded;
}

function fixValue(v) {
  if (typeof v === "string") return fixString(v);
  if (Array.isArray(v)) return v.map(fixValue);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fixValue(x)]));
  return v;
}

const TABLES = [
  "clinics", "profiles", "patients", "appointments", "appointment_types",
  "clinical_notes", "note_templates", "board_posts", "message_templates",
  "letter_templates", "patient_form_templates", "service_items", "tax_rates",
  "payment_types", "recall_types", "concession_types", "referral_sources",
  "custom_patient_fields", "block_types", "blocked_times", "invoices",
  "invoice_lines",
];

let totalFixes = 0;
for (const table of TABLES) {
  const { data, error } = await admin.from(table).select("*").limit(2000);
  if (error) {
    console.error(`${table}: SKIP (${error.message})`);
    continue;
  }
  for (const row of data ?? []) {
    const changes = {};
    for (const [col, val] of Object.entries(row)) {
      if (col === "id") continue;
      const fixed = fixValue(val);
      if (JSON.stringify(fixed) !== JSON.stringify(val)) changes[col] = fixed;
    }
    if (Object.keys(changes).length === 0) continue;
    totalFixes++;
    console.log(`${table} ${row.id}:`);
    for (const [col, fixed] of Object.entries(changes)) {
      console.log(`  ${col}: ${JSON.stringify(row[col])}`);
      console.log(`     -> ${JSON.stringify(fixed)}`);
    }
    if (APPLY) {
      const { error: upErr } = await admin.from(table).update(changes).eq("id", row.id);
      if (upErr) {
        console.error(`  UPDATE FAILED: ${upErr.message}`);
        process.exit(1);
      }
    }
  }
}
console.log(
  totalFixes === 0
    ? "No mojibake found."
    : `${totalFixes} row(s) ${APPLY ? "fixed" : "need fixing (dry run — rerun with --apply)"}.`
);
