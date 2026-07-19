// Seeds/updates the global outcome measure library from
// src/lib/outcomes/library.json (upsert by code). Run from the project root:
//   node scripts/seed-outcomes.mjs
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

const library = JSON.parse(
  readFileSync("src/lib/outcomes/library.json", "utf8")
);

for (const m of library) {
  const { error } = await admin.from("outcome_measures").upsert(
    {
      code: m.code,
      name: m.name,
      description: m.description,
      definition: m.definition,
      is_active: true,
    },
    { onConflict: "code" }
  );
  if (error) {
    console.error(`${m.code}: ${error.message}`);
    process.exit(1);
  }
  console.log(`${m.code}: ok (${m.definition.questions.length} questions)`);
}
console.log("Outcome measure library seeded.");
