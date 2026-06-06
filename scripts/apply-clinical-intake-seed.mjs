/**
 * Apply clinical intake questionnaires + product routing without opening Supabase SQL editor.
 *
 * Requires in `.env.local` (one-time from Supabase → Project Settings → API → service_role):
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Also uses existing:
 *   VITE_SUPABASE_URL
 *
 * Usage: node scripts/apply-clinical-intake-seed.mjs
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

global.WebSocket = ws;
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const p = join(root, ".env.local");
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };
const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error("Missing VITE_SUPABASE_URL in .env.local");
  process.exit(1);
}
if (!serviceKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local\n" +
      "Add it once from Supabase Dashboard → Project Settings → API → service_role (secret).\n" +
      "This script does not open the database UI — it uses the API only."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Mirrors src/lib/clinicalIntakeTemplates.ts — keep in sync */
const TEMPLATES = [
  {
    id: "a1000001-0001-4000-8000-000000000001",
    slug: "peak-wl-glp1-v1",
    name: "GLP-1 Weight Management Intake",
    categoryMatch: (c) => /weight|glp|semaglutide|tirzepatide/i.test(c),
    questionnaire: [
      { id: "wl_goal", title: "What is your primary weight-loss goal?", type: "choice", required: true, options: ["Lose 10–20 lbs", "Lose 20–50 lbs", "Lose 50+ lbs", "Maintain current weight"] },
      { id: "wl_pregnant", title: "Are you currently pregnant or planning pregnancy in the next 12 months?", type: "yes_no", required: true, requireVideoWhen: ["Yes"], blockSubmitWhen: ["Yes"] },
      { id: "wl_breastfeeding", title: "Are you currently breastfeeding?", type: "yes_no", required: true, showIf: { questionId: "wl_pregnant", values: ["No"] }, requireVideoWhen: ["Yes"] },
      { id: "wl_mtc_men2", title: "Personal or family history of MTC or MEN 2?", type: "yes_no", required: true, blockSubmitWhen: ["Yes"] },
      { id: "wl_type1_diabetes", title: "Do you have type 1 diabetes?", type: "yes_no", required: true, requireVideoWhen: ["Yes"] },
      { id: "wl_heart_failure", title: "Have you ever been diagnosed with heart failure?", type: "yes_no", required: true, requireVideoWhen: ["Yes"] },
      { id: "wl_chest_pain", title: "Chest pain or shortness of breath with exertion (past 3 months)?", type: "yes_no", required: true, requireVideoWhen: ["Yes"] },
      { id: "wl_pancreatitis", title: "History of pancreatitis?", type: "yes_no", required: true, blockSubmitWhen: ["Yes"] },
      { id: "wl_current_glp", title: "Currently on a GLP-1 medication?", type: "yes_no", required: true },
      { id: "wl_glp_med", title: "Which GLP-1 and dose?", type: "text", required: true, showIf: { questionId: "wl_current_glp", values: ["Yes"] } },
      { id: "wl_suicidal_ideation", title: "Thoughts of self-harm in the past 30 days?", type: "yes_no", required: true, blockSubmitWhen: ["Yes"] },
      { id: "wl_other_meds", title: "Daily medications and supplements", type: "text", required: true },
    ],
    video_clinical_rules: {
      bmiMin: 27,
      answerTriggers: [
        { questionId: "wl_pregnant", values: ["Yes"], message: "Pregnancy requires a live video visit.", flagManualReview: true },
        { questionId: "wl_mtc_men2", values: ["Yes"], blockSubmit: true, message: "MTC/MEN2 excludes GLP-1 online enrollment." },
        { questionId: "wl_type1_diabetes", values: ["Yes"], message: "Type 1 diabetes requires a video consultation." },
        { questionId: "wl_chest_pain", values: ["Yes"], flagManualReview: true },
        { questionId: "wl_suicidal_ideation", values: ["Yes"], blockSubmit: true },
      ],
    },
  },
  {
    id: "a1000001-0001-4000-8000-000000000002",
    slug: "peak-hair-v1",
    name: "Hair Loss & Restoration Intake",
    categoryMatch: (c) => /hair/i.test(c),
    questionnaire: [
      { id: "hl_onset", title: "When did thinning begin?", type: "choice", required: true, options: ["Less than 3 months", "3–12 months", "More than 1 year"] },
      { id: "hl_scalp_infection", title: "Active scalp infection or pain?", type: "yes_no", required: true, requireVideoWhen: ["Yes"] },
      { id: "hl_pregnant", title: "Pregnant, breastfeeding, or trying to conceive?", type: "yes_no", required: true, blockSubmitWhen: ["Yes"] },
    ],
    video_clinical_rules: {
      answerTriggers: [
        { questionId: "hl_scalp_infection", values: ["Yes"], flagManualReview: true },
        { questionId: "hl_pregnant", values: ["Yes"], blockSubmit: true },
      ],
    },
  },
  {
    id: "a1000001-0001-4000-8000-000000000003",
    slug: "peak-sw-v1",
    name: "Sexual Wellness Intake",
    categoryMatch: (c) => /sexual|men'?s|ed/i.test(c),
    questionnaire: [
      { id: "sw_primary_concern", title: "What are you seeking help for?", type: "choice", required: true, options: ["Erectile dysfunction", "Low libido", "Premature ejaculation", "Performance anxiety"] },
      { id: "sw_nitrates", title: "Take nitrate heart medications?", type: "yes_no", required: true, blockSubmitWhen: ["Yes"] },
      { id: "sw_cardiac_symptoms", title: "Chest pain with sexual activity (6 months)?", type: "yes_no", required: true, requireVideoWhen: ["Yes"] },
    ],
    video_clinical_rules: {
      answerTriggers: [
        { questionId: "sw_nitrates", values: ["Yes"], blockSubmit: true, message: "Nitrates are unsafe with ED medications." },
        { questionId: "sw_cardiac_symptoms", values: ["Yes"], flagManualReview: true },
      ],
    },
  },
];

function mergeFeatures(prev, tpl) {
  const next = { ...(prev && typeof prev === "object" && !Array.isArray(prev) ? prev : {}) };
  next.questionnaire_id = tpl.slug;
  next.questionnaire = tpl.questionnaire;
  next.video_clinical_rules = {
    ...(next.video_clinical_rules && typeof next.video_clinical_rules === "object"
      ? next.video_clinical_rules
      : {}),
    ...tpl.video_clinical_rules,
  };
  return next;
}

async function main() {
  console.log("Applying clinical intake seed via Supabase API…\n");

  for (const tpl of TEMPLATES) {
    const { error: qErr } = await supabase.from("admin_questionnaires").upsert(
      {
        id: tpl.id,
        name: tpl.name,
        slug: tpl.slug,
        status: "live",
        brand_id: null,
        questions: tpl.questionnaire,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (qErr) {
      console.error(`admin_questionnaires ${tpl.slug}:`, qErr.message);
      process.exit(1);
    }
    console.log(`✓ Questionnaire: ${tpl.name}`);
  }

  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, name, category, features")
    .eq("active", true);

  if (pErr) {
    console.error("products select:", pErr.message);
    process.exit(1);
  }

  let updated = 0;
  for (const p of products || []) {
    const cat = `${p.category || ""} ${p.name || ""}`;
    const tpl = TEMPLATES.find((t) => t.categoryMatch(cat));
    if (!tpl) continue;

    const features = mergeFeatures(p.features, tpl);
    const { error: uErr } = await supabase
      .from("products")
      .update({ features })
      .eq("id", p.id);

    if (uErr) {
      console.warn(`  skip ${p.name}: ${uErr.message}`);
      continue;
    }
    updated++;
    console.log(`✓ Product: ${p.name} (${p.category})`);
  }

  console.log(`\nDone. Questionnaires: ${TEMPLATES.length}, products updated: ${updated}`);
  console.log("Patient shop will load these on next catalog fetch (no SQL editor needed).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
