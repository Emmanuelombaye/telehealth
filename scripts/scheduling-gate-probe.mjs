/** One-off supplemental probe (anon) — run after check:scheduling-gate */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const lines = [];

const { data: rules, error: rErr } = await sb
  .from("consult_routing_rules")
  .select("id,label,active,priority,match_states,requires_sync_video")
  .eq("active", true)
  .limit(20);
if (rErr) lines.push(`consult_routing_rules: ERROR — ${rErr.message}`);
else lines.push(`consult_routing_rules (active): ${rules?.length ?? 0} row(s)`);

const { data: docs, error: dErr } = await sb
  .from("profiles")
  .select("id,full_name,calendly_url,licensed_states,role,status")
  .eq("role", "doctor")
  .eq("status", "active")
  .limit(20);
if (dErr) lines.push(`profiles (doctors): ERROR — ${dErr.message}`);
else {
  const withCal = (docs || []).filter((d) => d.calendly_url && String(d.calendly_url).startsWith("http"));
  lines.push(`profiles (active doctors): ${docs?.length ?? 0}, ${withCal.length} with calendar URL`);
  for (const d of withCal.slice(0, 5)) {
    lines.push(`  · ${d.full_name || d.id}: ${String(d.calendly_url).slice(0, 48)}…`);
  }
}

const envVideo = (env.VITE_VIDEO_REQUIRED_STATES || "").trim();
const envSched = (env.VITE_SCHEDULING_EMBED_URL || env.VITE_CALENDLY_DEFAULT_URL || "").trim();
lines.push(`env VITE_VIDEO_REQUIRED_STATES: ${envVideo || "(not set)"}`);
lines.push(`env VITE_SCHEDULING_EMBED_URL / CALENDLY_DEFAULT: ${envSched ? "set" : "(not set)"}`);

const { data: prods } = await sb.from("products").select("name,features").eq("active", true).limit(20);
for (const p of prods || []) {
  const f = p.features && typeof p.features === "object" && !Array.isArray(p.features) ? p.features : {};
  lines.push(
    `product "${p.name}": video=${!!f.requires_video_consult} states=${JSON.stringify(f.video_required_states || [])} sched=${!!(f.scheduling_embed_url || f.scheduling_url)} clinical=${!!f.video_clinical_rules} questionnaire=${Array.isArray(f.questionnaire) ? f.questionnaire.length + " Q" : "none"}`,
  );
}

console.log(lines.join("\n"));
