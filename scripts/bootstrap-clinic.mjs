// One-time production clinic bootstrap: creates the clinic row and the owner
// profile for an EXISTING Supabase auth user, with zero sample data. Safe to
// re-run (idempotent: skips anything that already exists).
//
// Prerequisites: the auth user already exists (Supabase dashboard →
// Authentication → Add user), and the target project's URL + service-role key
// are in the env file you point at.
//
// Usage (from the project root):
//   node scripts/bootstrap-clinic.mjs --env .env.production \
//     --email owner@clinic.com --clinic "My Clinic" \
//     --first Jane --last Smith [--title "Physiotherapist"] \
//     [--timezone Australia/Melbourne] [--dry-run]
//
// --env defaults to .env.local (handy for a local rehearsal). The email must
// match the auth user; it becomes the clinic contact email too.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const DRY = process.argv.includes("--dry-run");
const envFile = arg("env", ".env.local");
const email = arg("email");
const clinicName = arg("clinic");
const first = arg("first");
const last = arg("last");
const title = arg("title", null);
const timezone = arg("timezone", "Australia/Melbourne");

if (!email || !clinicName || !first || !last) {
  console.error(
    "Missing required args. Need --email, --clinic, --first, --last. See the header of this script."
  );
  process.exit(2);
}

const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`${envFile} must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`);
  process.exit(2);
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// 1. Find the auth user by email (must already exist).
const { data: userList, error: userErr } = await admin.auth.admin.listUsers();
if (userErr) {
  console.error("Could not list auth users: " + userErr.message);
  process.exit(1);
}
const user = userList.users.find(
  (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
);
if (!user) {
  console.error(
    `No auth user with email ${email}. Create it first: Supabase dashboard → Authentication → Add user.`
  );
  process.exit(1);
}
console.log(`Auth user found: ${user.id}`);

// 2. Existing profile? Then everything is already bootstrapped.
const { data: existingProfile } = await admin
  .from("profiles")
  .select("id, clinic_id, role")
  .eq("id", user.id)
  .maybeSingle();
if (existingProfile) {
  console.log(
    `Profile already exists (clinic ${existingProfile.clinic_id}, role ${existingProfile.role}) — nothing to do.`
  );
  process.exit(0);
}

// 3. Reuse a clinic with this name if one exists (partial prior run), else create.
const { data: existingClinic } = await admin
  .from("clinics")
  .select("id, name")
  .eq("name", clinicName)
  .maybeSingle();

if (DRY) {
  console.log(
    `[dry-run] Would ${existingClinic ? `reuse clinic ${existingClinic.id}` : `create clinic "${clinicName}" (${timezone})`} and create owner profile for ${first} ${last} <${email}>.`
  );
  process.exit(0);
}

let clinicId = existingClinic?.id;
if (!clinicId) {
  const { data: clinic, error: clinicErr } = await admin
    .from("clinics")
    .insert({ name: clinicName, timezone, email })
    .select("id")
    .single();
  if (clinicErr) {
    console.error("Clinic insert failed: " + clinicErr.message);
    process.exit(1);
  }
  clinicId = clinic.id;
  console.log(`Clinic created: ${clinicId}`);
} else {
  console.log(`Reusing existing clinic: ${clinicId}`);
}

const { error: profileErr } = await admin.from("profiles").insert({
  id: user.id,
  clinic_id: clinicId,
  role: "owner",
  first_name: first,
  last_name: last,
  title,
  email,
});
if (profileErr) {
  console.error("Profile insert failed: " + profileErr.message);
  process.exit(1);
}
console.log(`Owner profile created for ${first} ${last} — bootstrap complete. Sign in at the app URL.`);
