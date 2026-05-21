/**
 * Production-style clinical intake questionnaires + conditional routing.
 * Modeled on common telehealth GLP-1, hair, ED, and longevity intake patterns.
 *
 * Shop reads `label` + types: text | textarea | number | select | radio | checkbox
 * Per-question: showIf, requireVideoWhen, warningWhen, blockSubmitWhen
 * Product-level: video_clinical_rules.answerTriggers (see videoConsultRules.ts)
 */

import type { IntakeAnswerTrigger } from "./videoConsultRules";
import type { IntakeQuestion } from "./intakeConditionalLogic";

export type ShopIntakeQuestion = IntakeQuestion & {
  label: string;
  type: "text" | "textarea" | "number" | "select" | "radio" | "checkbox";
  required?: boolean;
  options?: string[];
};

export type ClinicalIntakeTemplate = {
  /** Match products.category (case-insensitive substring) */
  categoryMatch: string[];
  questionnaireId: string;
  questionnaireName: string;
  questionnaire: ShopIntakeQuestion[];
  videoClinicalRules?: {
    bmiMin?: number;
    ageMin?: number;
    answerTriggers?: IntakeAnswerTrigger[];
  };
  requiresVideoConsult?: boolean;
  videoRequiredStates?: string[];
};

/** Normalize admin builder rows (title / yes_no) → shop intake shape */
export function normalizeShopQuestion(raw: unknown): ShopIntakeQuestion | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  if (!id) return null;
  const label = String(o.label ?? o.title ?? "Question").trim();
  let type = String(o.type ?? "text").toLowerCase();
  if (type === "yes_no" || type === "yes/no") type = "radio";
  if (type === "choice") type = "select";
  const valid = ["text", "textarea", "number", "select", "radio", "checkbox"];
  if (!valid.includes(type)) type = "text";
  let options = Array.isArray(o.options) ? o.options.map(String) : undefined;
  if (type === "radio" && (!options || !options.length)) {
    options = ["Yes", "No"];
  }
  const q: ShopIntakeQuestion = {
    id,
    label,
    type: type as ShopIntakeQuestion["type"],
    required: o.required === true,
    options,
  };
  if (o.showIf && typeof o.showIf === "object") {
    const s = o.showIf as Record<string, unknown>;
    const qid = (s.questionId ?? s.question_id) as string | undefined;
    const vals = s.values;
    if (qid && Array.isArray(vals)) {
      q.showIf = { questionId: String(qid), values: vals.map(String) };
    }
  }
  if (Array.isArray(o.requireVideoWhen)) q.requireVideoWhen = o.requireVideoWhen.map(String);
  if (Array.isArray(o.require_video_when)) q.requireVideoWhen = o.require_video_when.map(String);
  if (o.warningWhen && typeof o.warningWhen === "object") {
    q.warningWhen = o.warningWhen as Record<string, string>;
  }
  if (o.warning_when && typeof o.warning_when === "object") {
    q.warningWhen = o.warning_when as Record<string, string>;
  }
  if (Array.isArray(o.blockSubmitWhen)) q.blockSubmitWhen = o.blockSubmitWhen.map(String);
  if (Array.isArray(o.block_submit_when)) q.blockSubmitWhen = o.block_submit_when.map(String);
  return q;
}

export function normalizeShopQuestionnaire(raw: unknown): ShopIntakeQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeShopQuestion).filter((q): q is ShopIntakeQuestion => q != null);
}

const WL_TRIGGERS: IntakeAnswerTrigger[] = [
  {
    questionId: "wl_pregnant",
    values: ["Yes"],
    message: "Pregnancy requires a live video visit before any prescription can be considered.",
    flagManualReview: true,
  },
  {
    questionId: "wl_breastfeeding",
    values: ["Yes"],
    message: "Breastfeeding requires clinician review on a video visit.",
    flagManualReview: true,
  },
  {
    questionId: "wl_type1_diabetes",
    values: ["Yes"],
    message: "Type 1 diabetes requires a synchronous video consultation for safe prescribing.",
  },
  {
    questionId: "wl_heart_failure",
    values: ["Yes"],
    message: "Heart failure history requires a video consultation with a licensed clinician.",
    flagManualReview: true,
  },
  {
    questionId: "wl_chest_pain",
    values: ["Yes"],
    message: "Chest pain or pressure requires an urgent video evaluation.",
    flagManualReview: true,
  },
  {
    questionId: "wl_pancreatitis",
    values: ["Yes"],
    message: "History of pancreatitis requires specialist video review.",
    blockSubmit: true,
  },
  {
    questionId: "wl_mtc_men2",
    values: ["Yes"],
    message: "MTC or MEN 2 syndrome excludes GLP-1 therapy — enrollment cannot continue online.",
    blockSubmit: true,
  },
  {
    questionId: "wl_suicidal_ideation",
    values: ["Yes"],
    message: "If you are in crisis, call 988. Online enrollment cannot proceed; please seek immediate care.",
    blockSubmit: true,
  },
];

export const WEIGHT_LOSS_GLP1_INTAKE: ClinicalIntakeTemplate = {
  categoryMatch: ["Weight Loss", "Weight Management", "GLP"],
  questionnaireId: "peak-wl-glp1-v1",
  questionnaireName: "GLP-1 Weight Management Intake",
  videoClinicalRules: {
    bmiMin: 27,
    answerTriggers: WL_TRIGGERS,
  },
  questionnaire: [
    {
      id: "wl_goal",
      label: "What is your primary weight-loss goal?",
      type: "select",
      required: true,
      options: [
        "Lose 10–20 lbs",
        "Lose 20–50 lbs",
        "Lose 50+ lbs",
        "Maintain current weight",
      ],
    },
    {
      id: "wl_pregnant",
      label: "Are you currently pregnant or planning pregnancy in the next 12 months?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
      warningWhen: {
        Yes: "GLP-1 medications are not appropriate during pregnancy. A clinician must speak with you on video.",
      },
      blockSubmitWhen: ["Yes"],
    },
    {
      id: "wl_breastfeeding",
      label: "Are you currently breastfeeding?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      showIf: { questionId: "wl_pregnant", values: ["No"] },
      requireVideoWhen: ["Yes"],
      warningWhen: {
        Yes: "Breastfeeding requires a video consultation before prescribing.",
      },
    },
    {
      id: "wl_mtc_men2",
      label: "Personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia type 2 (MEN 2)?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      blockSubmitWhen: ["Yes"],
      warningWhen: {
        Yes: "This history excludes GLP-1 therapy. You will not be able to complete enrollment online.",
      },
    },
    {
      id: "wl_type1_diabetes",
      label: "Do you have type 1 diabetes?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
      warningWhen: {
        Yes: "Type 1 diabetes requires a live video visit for safe medication planning.",
      },
    },
    {
      id: "wl_type2_diabetes",
      label: "Do you have type 2 diabetes or prediabetes?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
    },
    {
      id: "wl_heart_failure",
      label: "Have you ever been diagnosed with heart failure?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
      warningWhen: {
        Yes: "Heart failure requires a video consultation before treatment.",
      },
    },
    {
      id: "wl_chest_pain",
      label: "Chest pain, pressure, or shortness of breath with exertion in the past 3 months?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
      warningWhen: {
        Yes: "Cardiac symptoms require a synchronous video evaluation.",
      },
    },
    {
      id: "wl_pancreatitis",
      label: "History of pancreatitis or severe abdominal pain related to the pancreas?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      blockSubmitWhen: ["Yes"],
    },
    {
      id: "wl_gallbladder",
      label: "Gallbladder disease or gallstones in the past 12 months?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
    },
    {
      id: "wl_current_glp",
      label: "Are you currently taking a GLP-1 medication (Ozempic, Wegovy, Mounjaro, Zepbound, etc.)?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
    },
    {
      id: "wl_glp_med",
      label: "Which GLP-1 medication and approximate dose?",
      type: "text",
      required: true,
      showIf: { questionId: "wl_current_glp", values: ["Yes"] },
    },
    {
      id: "wl_depression",
      label: "History of depression or anxiety treated with medication?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
    },
    {
      id: "wl_suicidal_ideation",
      label: "Thoughts of self-harm or suicide in the past 30 days?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      showIf: { questionId: "wl_depression", values: ["Yes", "No"] },
      blockSubmitWhen: ["Yes"],
      warningWhen: {
        Yes: "If you are in immediate danger, call 911 or 988. We cannot complete online enrollment.",
      },
    },
    {
      id: "wl_other_meds",
      label: "List all prescription medications and supplements you take daily",
      type: "textarea",
      required: true,
    },
    {
      id: "wl_allergies",
      label: "Medication allergies or serious reactions",
      type: "textarea",
      required: false,
    },
  ],
};

export const HAIR_LOSS_INTAKE: ClinicalIntakeTemplate = {
  categoryMatch: ["Hair Loss", "Hair"],
  questionnaireId: "peak-hair-v1",
  questionnaireName: "Hair Loss & Restoration Intake",
  videoClinicalRules: {
    answerTriggers: [
      {
        questionId: "hl_scalp_infection",
        values: ["Yes"],
        message: "Active scalp infection requires a video exam before treatment.",
        flagManualReview: true,
      },
      {
        questionId: "hl_chest_symptoms",
        values: ["Yes"],
        message: "Chest symptoms on finasteride-related therapy require a video consultation.",
        flagManualReview: true,
      },
      {
        questionId: "hl_pregnant",
        values: ["Yes"],
        message: "Pregnancy excludes most hair-loss prescriptions online.",
        blockSubmit: true,
      },
    ],
  },
  questionnaire: [
    {
      id: "hl_onset",
      label: "When did you first notice increased shedding or thinning?",
      type: "select",
      required: true,
      options: ["Less than 3 months", "3–12 months", "More than 1 year"],
    },
    {
      id: "hl_pattern",
      label: "Where do you notice thinning most?",
      type: "select",
      required: true,
      options: ["Hairline / temples", "Crown", "Diffuse all over", "Patchy areas"],
    },
    {
      id: "hl_scalp_infection",
      label: "Scalp redness, pain, drainage, or diagnosed infection in the past month?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
      warningWhen: {
        Yes: "A clinician needs to examine your scalp via video before prescribing.",
      },
    },
    {
      id: "hl_finasteride_history",
      label: "Have you used finasteride or dutasteride before?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
    },
    {
      id: "hl_side_effects",
      label: "Any sexual side effects or mood changes on prior hair medications?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      showIf: { questionId: "hl_finasteride_history", values: ["Yes"] },
      requireVideoWhen: ["Yes"],
    },
    {
      id: "hl_chest_symptoms",
      label: "Breast tenderness, lumps, or nipple discharge?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
    },
    {
      id: "hl_liver",
      label: "Liver disease or elevated liver enzymes on recent labs?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      warningWhen: {
        Yes: "Liver history may require labs and clinician review.",
      },
    },
    {
      id: "hl_pregnant",
      label: "Are you pregnant, breastfeeding, or trying to conceive?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      blockSubmitWhen: ["Yes"],
      warningWhen: {
        Yes: "Many hair-loss prescriptions are not safe in pregnancy — enrollment cannot continue online.",
      },
    },
    {
      id: "hl_other_treatments",
      label: "Minoxidil, PRP, or other hair treatments in the last 6 months?",
      type: "textarea",
      required: false,
    },
  ],
};

export const SEXUAL_WELLNESS_INTAKE: ClinicalIntakeTemplate = {
  categoryMatch: ["Sexual Wellness", "Sexual", "ED", "Men's Health"],
  questionnaireId: "peak-sw-v1",
  questionnaireName: "Sexual Wellness Intake",
  videoClinicalRules: {
    answerTriggers: [
      {
        questionId: "sw_nitrates",
        values: ["Yes"],
        message: "Nitrate medications are unsafe with ED therapy — you cannot enroll online.",
        blockSubmit: true,
      },
      {
        questionId: "sw_cardiac_symptoms",
        values: ["Yes"],
        message: "Cardiac symptoms require a video consultation before ED treatment.",
        flagManualReview: true,
      },
      {
        questionId: "sw_blood_pressure",
        values: ["Uncontrolled (≥160/100 or symptomatic)"],
        message: "Uncontrolled blood pressure requires a live video visit.",
        flagManualReview: true,
      },
    ],
  },
  questionnaire: [
    {
      id: "sw_primary_concern",
      label: "What are you seeking help for today?",
      type: "select",
      required: true,
      options: [
        "Erectile dysfunction",
        "Low libido",
        "Premature ejaculation",
        "Performance anxiety",
      ],
    },
    {
      id: "sw_nitrates",
      label: "Do you take nitroglycerin, isosorbide, or any nitrate heart medication?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      blockSubmitWhen: ["Yes"],
      warningWhen: {
        Yes: "Nitrates combined with ED medication can be life-threatening. Online enrollment is not available.",
      },
    },
    {
      id: "sw_cardiac_symptoms",
      label: "Chest pain, palpitations, or fainting with sexual activity in the past 6 months?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
    },
    {
      id: "sw_blood_pressure",
      label: "How is your blood pressure currently managed?",
      type: "select",
      required: true,
      options: [
        "Normal / well controlled",
        "Elevated but monitored",
        "Uncontrolled (≥160/100 or symptomatic)",
        "I do not know",
      ],
      requireVideoWhen: ["Uncontrolled (≥160/100 or symptomatic)", "I do not know"],
    },
    {
      id: "sw_ed_duration",
      label: "How long have you had difficulty with erections?",
      type: "select",
      required: true,
      options: ["Less than 3 months", "3–12 months", "More than 1 year"],
      showIf: { questionId: "sw_primary_concern", values: ["Erectile dysfunction"] },
    },
    {
      id: "sw_alpha_blocker",
      label: "Do you take tamsulosin (Flomax) or other alpha-blockers for prostate?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      warningWhen: {
        Yes: "Alpha-blockers require dose timing guidance — a clinician will review on video if prescribed.",
      },
    },
    {
      id: "sw_other_meds",
      label: "List blood pressure, heart, and antidepressant medications",
      type: "textarea",
      required: true,
    },
  ],
};

export const LONGEVITY_INTAKE: ClinicalIntakeTemplate = {
  categoryMatch: ["Longevity", "NAD", "Anti-Aging", "Bio"],
  questionnaireId: "peak-longevity-v1",
  questionnaireName: "Longevity & NAD+ Intake",
  videoClinicalRules: {
    answerTriggers: [
      {
        questionId: "nad_cancer_active",
        values: ["Yes"],
        message: "Active cancer treatment requires oncology clearance — enrollment blocked online.",
        blockSubmit: true,
      },
      {
        questionId: "nad_pregnant",
        values: ["Yes"],
        blockSubmit: true,
        message: "Peptide and longevity protocols are not offered during pregnancy online.",
      },
    ],
  },
  questionnaire: [
    {
      id: "nad_goals",
      label: "What outcomes are you primarily seeking? (select all that apply)",
      type: "checkbox",
      required: true,
      options: ["Energy", "Focus", "Sleep", "Recovery", "Metabolic health", "Skin quality"],
    },
    {
      id: "nad_pregnant",
      label: "Are you pregnant or breastfeeding?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      blockSubmitWhen: ["Yes"],
    },
    {
      id: "nad_cancer_active",
      label: "Active cancer diagnosis or chemotherapy in the past 12 months?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      blockSubmitWhen: ["Yes"],
    },
    {
      id: "nad_autoimmune",
      label: "Autoimmune condition on immunosuppressive therapy?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
      warningWhen: {
        Yes: "Autoimmune therapy requires a video consultation for safe protocol selection.",
      },
    },
    {
      id: "nad_kidney",
      label: "Chronic kidney disease (stage 3 or higher)?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
    },
    {
      id: "nad_supplements",
      label: "Current supplements, peptides, or hormones (dose if known)",
      type: "textarea",
      required: true,
    },
  ],
};

export const SKINCARE_ASYNC_INTAKE: ClinicalIntakeTemplate = {
  categoryMatch: ["Skincare", "Skin", "Dermatology"],
  questionnaireId: "peak-skin-v1",
  questionnaireName: "Dermatology Async Intake",
  questionnaire: [
    {
      id: "skin_concern",
      label: "Primary skin concern",
      type: "select",
      required: true,
      options: ["Acne", "Rosacea", "Melasma", "Anti-aging", "Eczema flare"],
    },
    {
      id: "skin_severe",
      label: "Facial swelling, fever, or spreading redness?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      requireVideoWhen: ["Yes"],
      warningWhen: {
        Yes: "Possible infection — a same-day video visit is required.",
      },
    },
    {
      id: "skin_pregnant",
      label: "Pregnant or breastfeeding?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      blockSubmitWhen: ["Yes"],
    },
    {
      id: "skin_tretinoin",
      label: "Using prescription tretinoin or isotretinoin (Accutane)?",
      type: "radio",
      required: true,
      options: ["No", "Yes"],
      warningWhen: {
        Yes: "Retinoid use limits certain prescriptions — clinician will review your chart.",
      },
    },
    {
      id: "skin_photo",
      label: "Briefly describe affected areas and what you have tried",
      type: "textarea",
      required: true,
    },
  ],
};

export const CLINICAL_INTAKE_TEMPLATES: ClinicalIntakeTemplate[] = [
  WEIGHT_LOSS_GLP1_INTAKE,
  HAIR_LOSS_INTAKE,
  SEXUAL_WELLNESS_INTAKE,
  LONGEVITY_INTAKE,
  SKINCARE_ASYNC_INTAKE,
];

export function matchClinicalIntakeTemplate(category: string | null | undefined): ClinicalIntakeTemplate | null {
  const c = (category || "").trim().toLowerCase();
  if (!c) return null;
  for (const t of CLINICAL_INTAKE_TEMPLATES) {
    if (t.categoryMatch.some((m) => c.includes(m.toLowerCase()) || m.toLowerCase().includes(c))) {
      return t;
    }
  }
  return null;
}

/** Merge DB questionnaire with template fallback; attach routing rules from template when product lacks them. */
export function resolveProductIntakeFeatures(
  features: Record<string, unknown> | null | undefined,
  category: string
): {
  questionnaire: ShopIntakeQuestion[];
  rawFeatures: Record<string, unknown>;
} {
  const f =
    features && typeof features === "object" && !Array.isArray(features)
      ? { ...(features as Record<string, unknown>) }
      : {};

  const fromDb = normalizeShopQuestionnaire(f.questionnaire);
  const template = matchClinicalIntakeTemplate(category);
  const linkedId =
    typeof f.questionnaire_id === "string" ? f.questionnaire_id.trim() : "";

  let questionnaire: ShopIntakeQuestion[] = fromDb;
  if (template) {
    if (!questionnaire.length || linkedId === template.questionnaireId || !linkedId) {
      questionnaire = template.questionnaire;
    }
  } else if (!questionnaire.length) {
    questionnaire = [];
  }

  if (template) {
    if (!f.questionnaire_id) f.questionnaire_id = template.questionnaireId;
    const vc = (f.video_clinical_rules as Record<string, unknown>) || {};
    const tplVc = template.videoClinicalRules;
    if (tplVc && !vc.answerTriggers && !vc.answer_triggers) {
      f.video_clinical_rules = { ...tplVc };
    } else if (tplVc?.answerTriggers?.length && !(vc.answerTriggers || vc.answer_triggers)) {
      f.video_clinical_rules = { ...vc, answerTriggers: tplVc.answerTriggers };
    }
    if (template.requiresVideoConsult && f.requires_video_consult !== true) {
      f.requires_video_consult = true;
    }
    if (
      template.videoRequiredStates?.length &&
      !Array.isArray(f.video_required_states)
    ) {
      f.video_required_states = template.videoRequiredStates;
    }
  }

  if (questionnaire.length && !f.questionnaire) {
    f.questionnaire = questionnaire;
  }

  return { questionnaire, rawFeatures: f };
}

export function templateToAdminQuestions(template: ClinicalIntakeTemplate): unknown[] {
  return template.questionnaire.map((q) => ({
    id: q.id,
    title: q.label,
    type: q.type === "radio" ? "yes_no" : q.type === "select" ? "choice" : "text",
    required: q.required ?? false,
    options: q.options,
    showIf: q.showIf,
    requireVideoWhen: q.requireVideoWhen,
    warningWhen: q.warningWhen,
    blockSubmitWhen: q.blockSubmitWhen,
  }));
}
