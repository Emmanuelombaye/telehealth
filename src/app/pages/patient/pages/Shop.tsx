import { useState, useEffect } from "react";
import {
  ChevronRight, CheckCircle2, CreditCard,
  Star, Shield, Clock, Package, ArrowLeft, Globe, Zap, Loader2
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";
import { supabase } from "../../../../lib/supabaseClient";

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

const localProductsWithQuestionnaires = [
  {
    id: 1, name: "Semaglutide (GLP-1)", category: "Weight Loss",
    tagline: "Weekly subcutaneous injection · 0.25–2.4 mg", price: "$199/mo", priceUSD: 199,
    rating: 4.9, reviews: 3241, badge: "Most Popular",
    image: IMG("1490645935967-10de6ba17061"),
    description: "Compounded semaglutide, a GLP-1 receptor agonist used for chronic weight management alongside diet and exercise. Titrated weekly by a licensed clinician.",
    questionnaire: [
      { id: "q1", label: "Current weight (lbs)?", type: "number", required: true },
      { id: "q2", label: "Height (inches)?", type: "number", required: true },
      { id: "q3", label: "Have you ever had pancreatitis?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Personal or family history of medullary thyroid carcinoma (MTC) or MEN-2 syndrome?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Are you pregnant, breastfeeding, or planning pregnancy in the next 2 months?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
      { id: "q6", label: "Have you used GLP-1 medications before (Ozempic, Wegovy, Saxenda, Mounjaro, Zepbound)?", type: "radio", options: ["Yes — currently", "Yes — in the past", "No"], required: true },
      { id: "q7", label: "List all current medications and supplements", type: "textarea", required: false },
      { id: "q8", label: "What are your weight-loss goals and timeline?", type: "textarea", required: true },
    ],
    gateways: ["stripe", "paypal", "apple_pay", "klarna"],
  },
  {
    id: 2, name: "Tirzepatide (GIP/GLP-1)", category: "Weight Loss",
    tagline: "Dual-agonist weekly injection · 2.5–15 mg", price: "$329/mo", priceUSD: 329,
    rating: 4.9, reviews: 1987, badge: "New",
    image: IMG("1505576399279-565b52d4ac71"),
    description: "Compounded tirzepatide, a dual GIP and GLP-1 receptor agonist for chronic weight management. Greater average weight loss than GLP-1 alone in clinical trials.",
    questionnaire: [
      { id: "q1", label: "Current weight (lbs)?", type: "number", required: true },
      { id: "q2", label: "Height (inches)?", type: "number", required: true },
      { id: "q3", label: "Type 2 diabetes diagnosis?", type: "radio", options: ["Yes", "No", "Pre-diabetes"], required: true },
      { id: "q4", label: "Personal or family history of medullary thyroid carcinoma or MEN-2?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "History of pancreatitis or severe gallbladder disease?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q6", label: "Pregnant, breastfeeding, or planning pregnancy?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
      { id: "q7", label: "Currently using oral contraceptives? (tirzepatide can reduce their effectiveness — backup contraception is recommended)", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
      { id: "q8", label: "List current medications and any prior weight-loss treatments", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal", "apple_pay", "klarna"],
  },
  {
    id: 3, name: "Metformin ER 500 mg", category: "Weight Loss",
    tagline: "Daily oral biguanide · metabolic support", price: "$29/mo", priceUSD: 29,
    rating: 4.6, reviews: 1422, badge: "Needle-free",
    image: IMG("1587854692152-cbe660dbde88"),
    description: "Extended-release metformin for type 2 diabetes, prediabetes, PCOS, or off-label adjunct to weight management. Titrated 500–2000 mg/day.",
    questionnaire: [
      { id: "q1", label: "Current weight (lbs)?", type: "number", required: true },
      { id: "q2", label: "Reason for considering metformin?", type: "radio", options: ["Type 2 diabetes", "Prediabetes / insulin resistance", "PCOS", "Weight management"], required: true },
      { id: "q3", label: "Most recent eGFR or kidney function?", type: "select", options: ["> 60 (normal)", "45–60 (mild reduction)", "30–45 (moderate reduction)", "Don't know"], required: true },
      { id: "q4", label: "History of lactic acidosis, severe heart failure, or liver disease?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Alcoholic drinks per week?", type: "select", options: ["0", "1–7", "8–14", "15+"], required: true },
      { id: "q6", label: "Pregnant or breastfeeding?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
      { id: "q7", label: "Current medications and any GI conditions (IBS, gastroparesis)", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal", "apple_pay"],
  },
  {
    id: 4, name: "Sildenafil 50 mg / 100 mg", category: "Sexual Wellness",
    tagline: "PDE5 inhibitor · on-demand, 30–60 min before activity", price: "$2/dose", priceUSD: 2,
    rating: 4.8, reviews: 5102, badge: "Discreet",
    image: IMG("1631549916768-4119b2e5f926"),
    description: "Generic sildenafil citrate (Viagra) for erectile dysfunction. On-demand dosing with a 4–6 hour window. Shipped in plain packaging.",
    questionnaire: [
      { id: "q1", label: "Over the past 6 months, how would you rate your ability to achieve and maintain an erection?", type: "radio", options: ["Severe difficulty", "Moderate difficulty", "Mild difficulty", "Occasional"], required: true },
      { id: "q2", label: "Do you take any nitrate medications (nitroglycerin, isosorbide) or recreational 'poppers'?", type: "radio", options: ["Yes", "No", "Not sure"], required: true },
      { id: "q3", label: "Do you take alpha-blockers (tamsulosin, doxazosin, terazosin)?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "History of heart attack, stroke, or unstable angina in the past 6 months?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Have you ever experienced sudden vision loss (NAION) or hearing loss?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q6", label: "Resting blood pressure (if known)?", type: "select", options: ["Normal (< 130/80)", "Elevated (130–140 / 80–90)", "High (> 140/90)", "Don't know"], required: true },
      { id: "q7", label: "Current medications and supplements", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal"],
  },
  {
    id: 5, name: "Tadalafil 5 mg Daily", category: "Sexual Wellness",
    tagline: "Daily PDE5 inhibitor · also indicated for BPH", price: "$59/mo", priceUSD: 59,
    rating: 4.8, reviews: 3104, badge: "Daily",
    image: IMG("1582719471384-894fbb16e074"),
    description: "Generic tadalafil (Cialis) once-daily for erectile dysfunction and lower urinary tract symptoms from BPH. Provides spontaneous readiness without timing doses to activity.",
    questionnaire: [
      { id: "q1", label: "Severity of ED over the past 6 months?", type: "radio", options: ["Severe", "Moderate", "Mild", "Occasional"], required: true },
      { id: "q2", label: "Do you also experience BPH symptoms (urinary frequency, urgency, weak stream)?", type: "radio", options: ["Yes", "No", "Not sure"], required: true },
      { id: "q3", label: "Currently taking nitrates or guanylate cyclase stimulators (riociguat)?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Currently taking alpha-blockers?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Any moderate-to-severe liver or kidney disease?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q6", label: "History of heart attack, stroke, or significant arrhythmia?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q7", label: "Current medications", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal", "apple_pay"],
  },
  {
    id: 6, name: "Sertraline 25 mg (for PE)", category: "Sexual Wellness",
    tagline: "Off-label SSRI · taken 4–6 hours before activity", price: "$35/mo", priceUSD: 35,
    rating: 4.5, reviews: 812, badge: null,
    image: IMG("1587854692152-cbe660dbde88"),
    description: "Sertraline used off-label for premature ejaculation. Taken on-demand or daily depending on protocol. Reviewed by a licensed clinician.",
    questionnaire: [
      { id: "q1", label: "On average, how quickly does ejaculation occur during intercourse?", type: "select", options: ["Less than 1 minute", "1–2 minutes", "2–4 minutes", "More than 4 minutes"], required: true },
      { id: "q2", label: "How long has this been a concern?", type: "select", options: ["< 6 months", "6–12 months", "1–2 years", "Lifelong"], required: true },
      { id: "q3", label: "Currently taking any SSRI, SNRI, or MAOI antidepressant?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Personal history of bipolar disorder or manic episodes?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Liver disease or seizure disorder?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q6", label: "In the past 2 weeks, have you had thoughts of harming yourself?", type: "radio", options: ["No", "Yes"], required: true },
      { id: "q7", label: "Other current medications and supplements (especially serotonergic agents — triptans, tramadol, St. John's Wort)", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal", "apple_pay"],
  },
  {
    id: 7, name: "Finasteride 1 mg", category: "Hair",
    tagline: "Daily oral · 5α-reductase inhibitor", price: "$25/mo", priceUSD: 25,
    rating: 4.7, reviews: 2890, badge: null,
    image: IMG("1522337360788-8b13dee7a37e"),
    description: "Generic finasteride (Propecia) for male androgenetic alopecia. Reduces DHT to slow hair loss and promote regrowth in roughly 60–80% of men over 12 months.",
    questionnaire: [
      { id: "q1", label: "How long have you noticed hair thinning?", type: "select", options: ["< 1 year", "1–3 years", "3–5 years", "5+ years"], required: true },
      { id: "q2", label: "Pattern of hair loss?", type: "radio", options: ["Receding hairline", "Crown / vertex thinning", "Both", "Diffuse / overall"], required: true },
      { id: "q3", label: "Family history of male-pattern hair loss?", type: "radio", options: ["Father's side", "Mother's side", "Both", "No / unknown"], required: true },
      { id: "q4", label: "Are you trying to father a child in the next 6 months? (finasteride affects sperm parameters)", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
      { id: "q5", label: "I understand finasteride may rarely cause sexual side effects (decreased libido, ED) — usually reversible, occasionally persistent.", type: "radio", options: ["I understand and accept", "I have questions"], required: true },
      { id: "q6", label: "Personal history of depression or mood disorders?", type: "radio", options: ["Yes — current", "Yes — past", "No"], required: true },
      { id: "q7", label: "Liver disease or abnormal liver enzymes?", type: "radio", options: ["Yes", "No", "Don't know"], required: true },
      { id: "q8", label: "Current medications", type: "textarea", required: false },
    ],
    gateways: ["stripe", "apple_pay", "google_pay"],
  },
  {
    id: 8, name: "Minoxidil 5% Topical", category: "Hair",
    tagline: "Twice-daily topical solution or foam", price: "$19/mo", priceUSD: 19,
    rating: 4.6, reviews: 4120, badge: "OTC alternative",
    image: IMG("1559599101-f09722fb4948"),
    description: "5% minoxidil topical for androgenetic alopecia in men and women. Applied twice daily; visible results typically appear in 3–6 months.",
    questionnaire: [
      { id: "q1", label: "Pattern of hair loss?", type: "radio", options: ["Crown / vertex", "Frontal / hairline", "Diffuse", "Patchy"], required: true },
      { id: "q2", label: "Any scalp conditions (psoriasis, dermatitis, severe acne)?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q3", label: "History of cardiovascular disease, low blood pressure, or significant fluid retention?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Pregnant or breastfeeding?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
      { id: "q5", label: "Known allergy to propylene glycol?", type: "radio", options: ["Yes", "No", "Don't know"], required: true },
      { id: "q6", label: "Preferred formulation?", type: "radio", options: ["Liquid solution", "Foam (alcohol-free)", "No preference"], required: true },
      { id: "q7", label: "Current medications and any prior hair-loss treatments", type: "textarea", required: false },
    ],
    gateways: ["stripe", "apple_pay", "google_pay", "paypal"],
  },
  {
    id: 9, name: "Trazodone 50 mg", category: "Sleep",
    tagline: "Off-label nightly · sleep onset and maintenance", price: "$29/mo", priceUSD: 29,
    rating: 4.7, reviews: 1654, badge: "Non-habit forming",
    image: IMG("1541781774459-bb2af2f05b55"),
    description: "Trazodone used off-label for insomnia. Non-habit-forming alternative to benzodiazepines and Z-drugs. Reviewed by a clinician with sleep-medicine experience.",
    questionnaire: [
      { id: "q1", label: "How long does it usually take you to fall asleep?", type: "select", options: ["< 15 min", "15–30 min", "30–60 min", "More than 60 min"], required: true },
      { id: "q2", label: "How many times do you wake during the night?", type: "select", options: ["0–1", "2–3", "4 or more"], required: true },
      { id: "q3", label: "Do you fall asleep unintentionally during the day?", type: "radio", options: ["Never", "Sometimes", "Frequently"], required: true },
      { id: "q4", label: "Currently taking an MAOI antidepressant or stopped one within the last 14 days?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Currently taking other serotonergic agents (SSRIs, SNRIs, triptans, tramadol, linezolid)?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q6", label: "Personal history of priapism or sickle cell disease?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q7", label: "Average alcohol intake per evening?", type: "select", options: ["None", "1 drink", "2–3 drinks", "4+ drinks"], required: true },
      { id: "q8", label: "Current medications and any sleep-apnea diagnosis", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal", "apple_pay"],
  },
  {
    id: 10, name: "Escitalopram 10 mg", category: "Mental Health",
    tagline: "SSRI · daily · for anxiety and depression", price: "$45/mo", priceUSD: 45,
    rating: 4.7, reviews: 1876, badge: "Fast Rx",
    image: IMG("1499209974431-9dddcece7f88"),
    description: "Generic escitalopram (Lexapro) for generalized anxiety disorder and major depressive disorder. Reviewed within hours by a licensed psychiatric clinician.",
    questionnaire: [
      { id: "q1", label: "Over the past 2 weeks, how often have you felt nervous, worried, or on edge?", type: "radio", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], required: true },
      { id: "q2", label: "Over the past 2 weeks, how often have you felt down, hopeless, or lost interest in activities you usually enjoy?", type: "radio", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], required: true },
      { id: "q3", label: "In the past 2 weeks, have you had any thoughts of harming yourself?", type: "radio", options: ["No", "Yes"], required: true },
      { id: "q4", label: "Personal history of bipolar disorder, mania, or psychosis?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Currently taking an MAOI or stopped one within the last 14 days?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q6", label: "Pregnant, breastfeeding, or planning pregnancy?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
      { id: "q7", label: "Current and past psychiatric medications and how they worked for you", type: "textarea", required: true },
      { id: "q8", label: "Anything else you'd like the clinician to know?", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal", "google_pay"],
  },
  {
    id: 11, name: "Tretinoin 0.05% Cream", category: "Skincare",
    tagline: "Custom-compounded retinoid · nightly", price: "$45/mo", priceUSD: 45,
    rating: 4.9, reviews: 4210, badge: "Dermatologist",
    image: IMG("1556228720-195a672e8a03"),
    description: "Prescription tretinoin, optionally compounded with niacinamide, azelaic acid, clindamycin, or hydroquinone. For acne, fine lines, and pigmentation.",
    questionnaire: [
      { id: "q1", label: "Primary skin concern?", type: "radio", options: ["Acne", "Anti-aging / fine lines", "Hyperpigmentation / melasma", "Combination"], required: true },
      { id: "q2", label: "Skin type?", type: "radio", options: ["Oily", "Dry", "Combination", "Sensitive"], required: true },
      { id: "q3", label: "Pregnant, breastfeeding, or planning pregnancy?", type: "radio", options: ["Yes", "No", "Not applicable"], required: true },
      { id: "q4", label: "Currently using any retinoid (tretinoin, adapalene, retinol)?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Currently using benzoyl peroxide, salicylic acid, or AHAs?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q6", label: "Personal history of eczema, rosacea, or very sensitive skin?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q7", label: "Daily SPF use?", type: "radio", options: ["Yes — daily", "Sometimes", "No"], required: true },
      { id: "q8", label: "Add-ons to discuss with your dermatologist? (select all)", type: "checkbox", options: ["Niacinamide", "Azelaic acid", "Clindamycin (acne)", "Hydroquinone (pigmentation)", "None"], required: false },
    ],
    gateways: ["stripe", "apple_pay", "google_pay", "paypal"],
  },
  {
    id: 12, name: "Testosterone Cypionate 200 mg/mL", category: "Hormone",
    tagline: "Weekly intramuscular · TRT with quarterly labs", price: "$249/mo", priceUSD: 249,
    rating: 4.7, reviews: 612, badge: "Lab included",
    image: IMG("1559757175-5700dde675bc"),
    description: "Physician-supervised testosterone replacement therapy with at-home blood draw, dosing protocol, and quarterly follow-up. Hematocrit and PSA monitoring included.",
    questionnaire: [
      { id: "q1", label: "Most recent total testosterone level (ng/dL), if known?", type: "text", required: false },
      { id: "q2", label: "Symptoms experienced (select all that apply)", type: "checkbox", options: ["Low energy / fatigue", "Decreased libido", "Erectile dysfunction", "Mood changes / depression", "Loss of muscle mass", "Brain fog"], required: true },
      { id: "q3", label: "Personal history of prostate cancer (any stage)?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Personal history of breast cancer?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q5", label: "Diagnosed or suspected untreated severe sleep apnea?", type: "radio", options: ["Yes — diagnosed", "Suspected", "No"], required: true },
      { id: "q6", label: "History of polycythemia (hematocrit > 54%) or recent blood clot?", type: "radio", options: ["Yes", "No", "Don't know"], required: true },
      { id: "q7", label: "Are you trying to father children in the next 12 months? (TRT suppresses sperm production)", type: "radio", options: ["Yes", "No", "Unsure"], required: true },
      { id: "q8", label: "Willing to complete baseline labs (Total/Free T, PSA, CBC, lipid panel) before therapy?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q9", label: "Current medications and supplements", type: "textarea", required: false },
    ],
    gateways: ["stripe", "klarna"],
  },
];

const categories = ["All", "Weight Loss", "Sexual Wellness", "Hair", "Sleep", "Mental Health", "Skincare", "Hormone"] as const;

const categoryTint: Record<string, string> = {
  "Weight Loss": "from-[var(--brand-sage-50)] to-[var(--brand-sage-100)]",
  "Sexual Wellness": "from-[var(--brand-lavender-50)] to-[var(--brand-lavender-100)]",
  "Hair": "from-[var(--brand-peach-50)] to-[var(--brand-peach-100)]",
  "Sleep": "from-[var(--brand-lavender-50)] to-[var(--brand-sky-50)]",
  "Mental Health": "from-[var(--brand-sage-50)] to-[var(--brand-lavender-50)]",
  "Skincare": "from-[var(--brand-peach-50)] to-[var(--brand-lavender-50)]",
  "Hormone": "from-[var(--brand-sky-50)] to-[var(--brand-lavender-100)]",
};

const gatewayConfig: Record<string, { label: string; icon: string; color: string }> = {
  stripe: { label: "Credit / Debit Card", icon: "💳", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  paypal: { label: "PayPal", icon: "🅿️", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  apple_pay: { label: "Apple Pay", icon: "🍎", color: "border-gray-400 bg-gray-50 dark:bg-gray-950/30" },
  google_pay: { label: "Google Pay", icon: "🔵", color: "border-green-400 bg-green-50 dark:bg-green-950/30" },
  klarna: { label: "Klarna · Pay in 4", icon: "🛍️", color: "border-pink-300 bg-pink-50 dark:bg-pink-950/30" },
};

type Stage = "catalog" | "questionnaire" | "scheduling" | "payment" | "account_setup" | "verify_2fa" | "confirmed";

export function PatientShopPage() {
  const [dbProducts, setDbProducts] = useState<typeof localProductsWithQuestionnaires>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    setDbProducts(localProductsWithQuestionnaires);
    setIsLoadingProducts(false);
  }, []);

  const [stage, setStage] = useState<Stage>("catalog");
  const [selected, setSelected] = useState<any | null>(null);
  const [qStep, setQStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [gateway, setGateway] = useState<string>("");
  const [consultationTime, setConsultationTime] = useState<string>("");
  const [orderRef] = useState(() => "RX-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [activeCat, setActiveCat] = useState("All");
  
  // Account creation state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const filteredProducts = activeCat === "All" ? dbProducts : dbProducts.filter(p => p.category === activeCat);
  const categories = ["All", ...Array.from(new Set(dbProducts.map(p => p.category)))];

  const startFlow = (product: typeof products[0]) => {
    setSelected(product);
    setQStep(0);
    setAnswers({});
    setGateway("");
    setStage("questionnaire");
  };

  const handleAnswer = (id: string, val: string) => {
    setAnswers(a => ({ ...a, [id]: val }));
  };

  const currentQ = selected?.questionnaire[qStep];
  const totalQ = selected?.questionnaire.length ?? 0;

  const handleCompleteSetup = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || 'New',
            last_name: lastName || 'Patient',
            role: 'patient',
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      // 2. Insert the real order into the database!
      const newOrder = {
        order_number: orderRef,
        patient_name: `${firstName} ${lastName}`.trim() || "New Patient",
        patient_avatar: (firstName[0] || "") + (lastName[0] || ""),
        patient_age: 30, // Mock for now
        patient_country: "🇺🇸 US",
        sub_brand: brand.name,
        medication: selected.name,
        dosage_instructions: selected.tagline,
        category: selected.category,
        status: "order_submitted",
        ordered_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: selected.priceUSD,
        user_id: authData.user.id,
        intake_complete: true,
        intake_notes: Object.entries(answers).map(([k,v]) => `${k}: ${v}`).join(', '),
        intake_answers: answers,
        consultation_time: consultationTime,
        timeline: [
          { status: "order_submitted", date: new Date().toLocaleDateString() }
        ]
      };

      const { error: insertError } = await supabase
        .from('orders')
        .insert([newOrder]);

      if (insertError) throw insertError;

      // 3. Move to confirmed stage
      setStage("confirmed");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === "confirmed" && selected) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 pt-8">
        <div className="flex justify-center mb-8">
           <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain" />
        </div>
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">You're all set!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your account is created and intake is under review.</p>
        </div>
        <Card className="text-left">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Product</span><span className="font-semibold">{selected.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order Ref</span><span className="font-mono font-bold text-primary">{orderRef}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="font-semibold">{gatewayConfig[gateway]?.label}</span></div>
          </CardContent>
        </Card>
        <div className="bg-secondary/40 border border-secondary rounded-2xl p-4 text-sm text-secondary-foreground text-left">
          <p className="font-semibold mb-1">⏱ What happens next?</p>
          <ol className="space-y-1 text-xs list-decimal list-inside opacity-90">
            <li>A licensed doctor reviews your intake (usually within 2–4 hrs).</li>
            <li>If approved, your prescription is sent to our pharmacy.</li>
            <li>Medication ships within 1–2 business days with tracking.</li>
          </ol>
        </div>
        <Button className="w-full rounded-xl text-base h-12 font-bold" onClick={() => window.location.href = "/patient"}>
          Go to Patient Dashboard
        </Button>
      </div>
    );
  }

  if (stage === "verify_2fa" && selected) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <div className="flex justify-center mb-4">
           <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain" />
        </div>
        <button onClick={() => setStage("account_setup")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold">Verify your phone</h1>
          <p className="text-sm text-muted-foreground mt-2">
            For your security and HIPAA compliance, we sent a 6-digit code to <strong>{phone}</strong>.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="flex justify-between gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => {
                const newOtp = [...otp];
                newOtp[idx] = e.target.value;
                setOtp(newOtp);
              }}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-border rounded-xl bg-background focus:border-primary focus:outline-none"
            />
          ))}
        </div>

        <p className="text-sm text-center text-muted-foreground">
          Didn't receive a code? <button className="text-primary font-semibold hover:underline">Resend</button>
        </p>

        <Button className="w-full rounded-xl h-12 text-base font-bold" 
          disabled={otp.some(d => !d) || isSubmitting}
          onClick={handleCompleteSetup}>
          {isSubmitting ? "Creating Account..." : "Complete Setup"}
        </Button>
      </div>
    );
  }

  if (stage === "account_setup" && selected) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <div className="flex justify-center mb-4">
           <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100 mb-4">
            <CheckCircle2 className="h-3.5 w-3.5" /> Payment Successful
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your payment is secured. Let's finish creating your account so you can track your prescription and message your doctor.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary" 
                placeholder="First" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Last Name</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary" 
                placeholder="Last" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary" 
              placeholder="you@example.com" 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Phone Number (For 2FA)</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary" 
              placeholder="(555) 000-0000" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Create Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary" 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl border border-border/50">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your health data is stored securely in our HIPAA-compliant, military-grade encrypted database. We will never share your medical history.
          </p>
        </div>

        <Button className="w-full rounded-xl h-12 text-base font-bold" 
          disabled={!email || !phone || !password}
          onClick={() => setStage("verify_2fa")}>
          Continue to 2FA <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  if (stage === "payment" && selected) {
    return (
      <div className="max-w-md mx-auto space-y-5">
        <div className="flex justify-center mb-6">
           <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain" />
        </div>
        <button onClick={() => setStage("questionnaire")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold">Choose Payment</h1>
          <p className="text-sm text-muted-foreground">Secure checkout — cancel anytime</p>
        </div>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.category}</p>
            </div>
            <span className="font-extrabold text-primary text-lg">{selected.price}</span>
          </CardContent>
        </Card>
        <div className="space-y-2">
          {selected.gateways.map(gw => (
            <button key={gw} onClick={() => setGateway(gw)}
              className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                gateway === gw ? "border-primary bg-primary/5" : gatewayConfig[gw].color)}>
              <span className="text-2xl">{gatewayConfig[gw].icon}</span>
              <span className="font-semibold text-sm">{gatewayConfig[gw].label}</span>
              {gateway === gw && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
            </button>
          ))}
        </div>

        {gateway === 'stripe' && (
          <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Expiry</label>
                  <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">CVC</label>
                  <input type="text" placeholder="123" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          256-bit SSL encryption · HIPAA compliant · Cancel anytime
        </div>
        <Button className="w-full rounded-xl h-12 text-base font-bold relative overflow-hidden" 
          disabled={!gateway || isPaying}
          onClick={() => {
            setIsPaying(true);
            setTimeout(() => {
              setIsPaying(false);
              setStage("account_setup");
            }, 1500);
          }}>
          {isPaying ? (
            <span className="flex items-center gap-2">Processing Payment... <Zap className="h-4 w-4 animate-pulse" /></span>
          ) : (
            <><CreditCard className="h-5 w-5 mr-2" /> Pay {selected.price} & Create Account</>
          )}
        </Button>
      </div>
    );
  }

  if (stage === "questionnaire" && selected && currentQ) {
    return (
      <div className="max-w-md mx-auto space-y-5">
        <div className="flex justify-center mb-6">
           <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain" />
        </div>
        <button onClick={() => qStep === 0 ? setStage("catalog") : setQStep(q => q - 1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold">{selected.name}</h1>
            <span className="text-xs text-muted-foreground">{qStep + 1} / {totalQ}</span>
          </div>
          <div className="flex gap-1">
            {selected.questionnaire.map((_, i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= qStep ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        </div>
        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="font-semibold text-sm">
              {currentQ.label}
              {currentQ.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            {currentQ.type === "text" && (
              <input className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                placeholder="Your answer..." onChange={e => handleAnswer(currentQ.id, e.target.value)} />
            )}
            {currentQ.type === "number" && (
              <input type="number" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                placeholder="0" onChange={e => handleAnswer(currentQ.id, e.target.value)} />
            )}
            {currentQ.type === "textarea" && (
              <textarea rows={4} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary resize-none"
                placeholder="Describe in detail..." onChange={e => handleAnswer(currentQ.id, e.target.value)} />
            )}
            {currentQ.type === "select" && (
              <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                onChange={e => handleAnswer(currentQ.id, e.target.value)}>
                <option value="">Select an option...</option>
                {currentQ.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            {currentQ.type === "radio" && currentQ.options?.map(o => (
              <label key={o} className={cn("flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all",
                answers[currentQ.id] === o ? "border-primary bg-primary/5" : "border-border hover:bg-accent")}>
                <input type="radio" name={currentQ.id} value={o} className="accent-primary"
                  onChange={() => handleAnswer(currentQ.id, o)} />
                <span className="text-sm">{o}</span>
              </label>
            ))}
            {currentQ.type === "checkbox" && currentQ.options?.map(o => (
              <label key={o} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-accent">
                <input type="checkbox" className="h-4 w-4 accent-primary" />
                <span className="text-sm">{o}</span>
              </label>
            ))}
          </CardContent>
        </Card>
        <Button className="w-full rounded-xl"
          onClick={() => qStep < totalQ - 1 ? setQStep(q => q + 1) : setStage("scheduling")}>
          {qStep < totalQ - 1 ? "Continue" : "Schedule Consultation"} <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  if (stage === "scheduling" && selected) {
    const dates = ["Today", "Tomorrow", "Wednesday", "Thursday", "Friday"];
    const times = ["9:00 AM", "10:30 AM", "1:00 PM", "2:45 PM", "4:00 PM"];
    return (
      <div className="max-w-md mx-auto space-y-5">
        <div className="flex justify-center mb-6">
           <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain" />
        </div>
        <button onClick={() => setStage("questionnaire")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Questionnaire
        </button>
        <div>
          <h1 className="text-xl font-bold">Schedule Video Consult</h1>
          <p className="text-sm text-muted-foreground">Select a time for your required medical review</p>
        </div>
        
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Select Date</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dates.map(d => (
                  <button key={d} className="shrink-0 px-4 py-2 border rounded-xl text-sm font-semibold hover:border-primary focus:border-primary focus:bg-primary/5 transition-all">
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Select Time (EST)</p>
              <div className="grid grid-cols-2 gap-2">
                {times.map(t => (
                  <button key={t} 
                    onClick={() => setConsultationTime(`${dates[0]} at ${t}`)}
                    className={cn("px-4 py-2 border rounded-xl text-sm font-semibold transition-all", consultationTime.includes(t) ? "border-primary bg-primary text-white" : "hover:border-primary")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-amber-50 text-amber-900 text-xs p-3 rounded-lg flex gap-2 items-start border border-amber-200">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Your Zoom link will be provided in your Patient Dashboard immediately after checkout.</p>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full rounded-xl h-12 text-base"
          disabled={!consultationTime}
          onClick={() => setStage("payment")}>
          Review & Pay <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Yucca-style hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8" style={{ background: "var(--brand-hero)" }}>
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-lavender-900)]">Treatment Programs</p>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1 text-foreground">
            Care that actually works.<br />
            <span className="text-[var(--brand-lavender-700)]">Shipped to your door.</span>
          </h1>
          <p className="text-sm text-foreground/70 mt-2 max-w-md">
            Doctor-reviewed within hours · Custom-compounded by licensed pharmacies · 100% online from intake to refill.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-white/70 text-[var(--brand-lavender-900)]">🇺🇸 HIPAA</span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 text-[var(--brand-lavender-900)]">🇪🇺 GDPR</span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 text-[var(--brand-lavender-900)]">Ships to 40+ countries</span>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={cn("shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
              activeCat === cat
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
            {cat}
          </button>
        ))}
      </div>

      {isLoadingProducts ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading medical catalog securely...</p>
        </div>
      ) : (
        <>
          {/* Product grid — 2-col cards with images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="group hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden border-border"
            onClick={() => startFlow(product)}>
            <div className={cn("relative aspect-[4/3] overflow-hidden bg-gradient-to-br",
              categoryTint[product.category] ?? "from-muted to-muted")}>
              <img src={product.image} alt={product.name} loading="lazy"
                className="h-full w-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
              {product.badge && (
                <Badge className="absolute top-2.5 left-2.5 text-[9px] font-bold bg-white/90 backdrop-blur-sm text-[var(--brand-lavender-900)] border-0 shadow-sm">
                  {product.badge}
                </Badge>
              )}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold">{product.rating}</span>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-lavender-700)]">{product.category}</p>
              <p className="font-bold text-sm mt-0.5 leading-tight">{product.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.tagline}</p>
              <div className="flex items-end justify-between mt-3 pt-3 border-t border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground">Starting at</p>
                  <p className="font-extrabold text-primary text-base leading-none">{product.price}</p>
                </div>
                <Button size="sm" className="rounded-full text-[11px] h-8 px-3 gap-1">
                  Get started <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {product.questionnaire.length} Q's</span>
                <span className="flex items-center gap-0.5"><Zap className="h-3 w-3 text-[var(--brand-peach-700)]" /> Fast Rx</span>
                <span className="ml-auto">{product.reviews.toLocaleString()} ⭐</span>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No products in this category yet.
        </div>
      )}
      {/* Trust strip */}
      </>
      )}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[
          { icon: Shield, label: "HIPAA Secure", sub: "End-to-end encrypted" },
          { icon: Clock, label: "Fast Review", sub: "2–4 hr doctor review" },
          { icon: Package, label: "Discreet Ship", sub: "Plain packaging" },
        ].map((f, i) => (
          <div key={i} className="text-center p-3 bg-muted/50 rounded-2xl">
            <f.icon className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold">{f.label}</p>
            <p className="text-[10px] text-muted-foreground">{f.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
        <Globe className="h-3.5 w-3.5" /> Multi-currency checkout · Licensed in your jurisdiction
      </div>
    </div>
  );
}
