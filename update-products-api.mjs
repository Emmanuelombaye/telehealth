import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvopgyhcjcniaocjozje.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

const localProductsWithQuestionnaires = [
  {
    name: "Semaglutide (GLP-1)", category: "Weight Loss",
    tagline: "Weekly subcutaneous injection · 0.25–2.4 mg", price_usd: 199,
    image_url: IMG("1490645935967-10de6ba17061"),
    description: "Compounded semaglutide, a GLP-1 receptor agonist used for chronic weight management alongside diet and exercise. Titrated weekly by a licensed clinician.",
    features: {
      rating: 4.9, reviews: 3241, badge: "Most Popular",
      gateways: ["stripe", "paypal", "apple_pay", "klarna"],
      questionnaire: [
        { id: "q1", label: "Current weight (lbs)?", type: "number", required: true },
        { id: "q2", label: "Height (inches)?", type: "number", required: true },
        { id: "q3", label: "Have you ever had pancreatitis?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "q4", label: "Personal or family history of medullary thyroid carcinoma (MTC) or MEN-2 syndrome?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "q5", label: "Are you pregnant, breastfeeding, or planning pregnancy in the next 2 months?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
        { id: "q6", label: "Have you used GLP-1 medications before?", type: "radio", options: ["Yes — currently", "Yes — in the past", "No"], required: true },
        { id: "q7", label: "List all current medications and supplements", type: "textarea", required: false },
        { id: "q8", label: "What are your weight-loss goals and timeline?", type: "textarea", required: true },
      ]
    },
    popular: true, active: true
  },
  {
    name: "Tirzepatide (GIP/GLP-1)", category: "Weight Loss",
    tagline: "Dual-agonist weekly injection · 2.5–15 mg", price_usd: 329,
    image_url: IMG("1505576399279-565b52d4ac71"),
    description: "Compounded tirzepatide, a dual GIP and GLP-1 receptor agonist for chronic weight management. Greater average weight loss than GLP-1 alone in clinical trials.",
    features: {
      rating: 4.9, reviews: 1987, badge: "New",
      gateways: ["stripe", "paypal", "apple_pay", "klarna"],
      questionnaire: [
        { id: "q1", label: "Current weight (lbs)?", type: "number", required: true },
        { id: "q2", label: "Height (inches)?", type: "number", required: true },
        { id: "q3", label: "Type 2 diabetes diagnosis?", type: "radio", options: ["Yes", "No", "Pre-diabetes"], required: true },
        { id: "q4", label: "Personal or family history of medullary thyroid carcinoma or MEN-2?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "q5", label: "History of pancreatitis or severe gallbladder disease?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "q6", label: "Pregnant, breastfeeding, or planning pregnancy?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
        { id: "q7", label: "Currently using oral contraceptives?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
        { id: "q8", label: "List current medications and any prior weight-loss treatments", type: "textarea", required: false },
      ]
    },
    popular: true, active: true
  },
  {
    name: "Sildenafil 50 mg / 100 mg", category: "Sexual Wellness",
    tagline: "PDE5 inhibitor · on-demand, 30–60 min before activity", price_usd: 2,
    image_url: IMG("1631549916768-4119b2e5f926"),
    description: "Generic sildenafil citrate (Viagra) for erectile dysfunction. On-demand dosing with a 4–6 hour window. Shipped in plain packaging.",
    features: {
      rating: 4.8, reviews: 5102, badge: "Discreet",
      gateways: ["stripe", "paypal"],
      questionnaire: [
        { id: "q1", label: "Ability to achieve/maintain erection?", type: "radio", options: ["Severe", "Moderate", "Mild", "Occasional"], required: true },
        { id: "q2", label: "Do you take any nitrate medications?", type: "radio", options: ["Yes", "No", "Not sure"], required: true },
        { id: "q3", label: "Do you take alpha-blockers?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "q4", label: "History of heart attack, stroke?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "q5", label: "Have you ever experienced sudden vision loss?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "q6", label: "Resting blood pressure?", type: "select", options: ["Normal (< 130/80)", "Elevated", "High", "Don't know"], required: true },
        { id: "q7", label: "Current medications", type: "textarea", required: false },
      ]
    },
    popular: true, active: true
  },
  {
    name: "Finasteride 1 mg", category: "Hair",
    tagline: "Daily oral · 5α-reductase inhibitor", price_usd: 25,
    image_url: IMG("1522337360788-8b13dee7a37e"),
    description: "Generic finasteride (Propecia) for male androgenetic alopecia.",
    features: {
      rating: 4.7, reviews: 2890, badge: null,
      gateways: ["stripe", "apple_pay", "google_pay"],
      questionnaire: [
        { id: "q1", label: "How long have you noticed hair thinning?", type: "select", options: ["< 1 year", "1-3 years", "3-5 years", "5+ years"], required: true },
        { id: "q2", label: "Pattern of hair loss?", type: "radio", options: ["Receding hairline", "Crown / vertex thinning", "Both", "Diffuse"], required: true },
        { id: "q3", label: "Family history of male-pattern hair loss?", type: "radio", options: ["Father's side", "Mother's side", "Both", "No"], required: true },
        { id: "q4", label: "Trying to father a child in next 6 months?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
        { id: "q5", label: "I understand finasteride may cause side effects.", type: "radio", options: ["I understand and accept", "I have questions"], required: true },
        { id: "q6", label: "Personal history of depression?", type: "radio", options: ["Yes", "No"], required: true },
        { id: "q7", label: "Liver disease?", type: "radio", options: ["Yes", "No", "Don't know"], required: true },
        { id: "q8", label: "Current medications", type: "textarea", required: false },
      ]
    },
    popular: false, active: true
  }
];

async function seed() {
  // Clear old products
  console.log("Deleting old products...");
  const { error: delErr } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.error("Error deleting:", delErr);

  console.log("Inserting new products...");
  const { data, error } = await supabase.from('products').insert(localProductsWithQuestionnaires);
  if (error) console.error("Error inserting:", error);
  else console.log("Success! Products seeded.");
}

seed();
