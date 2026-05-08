import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight, CheckCircle2, CreditCard,
  Star, Shield, Clock, Package, ArrowLeft, Globe, Zap, Loader2,
  Video, MessageSquare
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

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

type Stage = "catalog" | "payment" | "account_setup" | "questionnaire" | "scheduling" | "confirmed";

export function PatientShopPage() {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
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
  const [zoomWanted, setZoomWanted] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [orderRef] = useState(() => "RX-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [activeCat, setActiveCat] = useState("All");
  
  // Account creation state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weight, setWeight] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [currentMeds, setCurrentMeds] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  // Payment card fields
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const filteredProducts = activeCat === "All" ? dbProducts : dbProducts.filter(p => p.category === activeCat);
  const categories = ["All", ...Array.from(new Set(dbProducts.map(p => p.category)))];

  const startFlow = (product: any) => {
    setSelected(product);
    setQStep(0);
    setAnswers({});
    setGateway("");
    setStage("payment");
  };

  const handleAnswer = (id: string, val: string) => {
    setAnswers(a => ({ ...a, [id]: val }));
  };

  const currentQ = selected?.questionnaire[qStep];
  const totalQ = selected?.questionnaire.length ?? 0;

  const handleCompleteSetup = async () => {
    if (!selected || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const heightInches = (parseInt(heightFt || '0') * 12) + parseInt(heightIn || '0');
    const weightNum = parseFloat(weight || '0');
    const bmi = heightInches > 0 && weightNum > 0
      ? ((weightNum / (heightInches * heightInches)) * 703).toFixed(1)
      : 'N/A';
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 30;
    const patientVitals = {
      dob, sex,
      height: `${heightFt}'${heightIn}"`,
      weight: `${weight} lbs`, bmi,
      hairColor, eyeColor, bloodType,
      allergies: allergies || 'None',
      currentMeds: currentMeds || 'None',
      address: `${address}, ${city}, ${state} ${zip}`,
      phone, email
    };

    try {
      // 0. Final validation to prevent 422 (Unprocessable Content)
      if (!email || !email.includes('@')) throw new Error("A valid email is required.");
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (!firstName || !lastName) throw new Error("First and last name are required.");

      // 1. Create Supabase Auth account
      let userId: string | null = null;
      let sessionToSet = null;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName || 'New',
            last_name: lastName || 'Patient',
            date_of_birth: dob,
            phone,
            role: 'patient',
          }
        }
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        // 500 = server-side trigger error — user may still have been created
        // Try signing in with the same credentials as a fallback
        if (authError.status === 500 || msg.includes('unexpected') || msg.includes('server')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (!signInError && signInData.user) {
            // User was actually created — proceed normally
            userId = signInData.user.id;
            sessionToSet = signInData.session;
          } else {
            throw new Error("Account creation failed (server error). Please try again in a moment.");
          }
        } else if (msg.includes('already registered') || msg.includes('already exists')) {
          throw new Error("This email is already registered. Please sign in at /patient/login instead.");
        } else {
          throw authError;
        }
      } else {
        userId = authData.user?.id || null;
        sessionToSet = authData.session;
      }

      if (!userId) throw new Error("Account creation failed — please try again.");

      // 2. Insert order with full patient vitals into Supabase
      const { error: insertError } = await supabase.from('orders').insert([{
        order_number: orderRef,
        patient_name: `${firstName} ${lastName}`.trim() || "New Patient",
        patient_avatar: (firstName[0] || "") + (lastName[0] || ""),
        patient_age: age,
        patient_country: "🇺🇸 US",
        sub_brand: "Peak Health",
        medication: selected.name,
        dosage_instructions: selected.tagline,
        category: selected.category,
        status: "order_submitted",
        ordered_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: selected.priceUSD,
        user_id: userId,
        intake_complete: true,
        intake_notes: `H: ${patientVitals.height} | W: ${weight}lbs | BMI: ${bmi} | Sex: ${sex} | Blood: ${bloodType} | Allergies: ${allergies || 'None'} | Meds: ${currentMeds || 'None'}`,
        intake_answers: answers,
        patient_vitals: patientVitals,
        consultation_time: consultationTime || null,
        zoom_status: zoomWanted && consultationTime ? 'requested' : 'not_requested',
        zoom_doctor_message: null,
        zoom_rescheduled_time: null,
        timeline: [{ status: "order_submitted", date: new Date().toLocaleDateString() }]
      }]);

      if (insertError) console.warn("Order insert warning:", insertError.message);

      // 3. Auto sign-in + refresh auth store
      if (sessionToSet) {
        await supabase.auth.setSession(sessionToSet);
      } else {
        // Session wasn't returned (email confirmation ON or fallback signin used)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });
        if (signInError) console.warn("Auto-login pending email confirmation:", signInError.message);
      }

      // Re-initialize auth store so ProtectedRoute sees the new session immediately
      await initialize();

      setStage("confirmed");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
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
          <h2 className="text-xl font-bold">Welcome to Peak Health, {firstName}!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your account is created and intake is under review.</p>
        </div>
        <Card className="text-left">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Product</span><span className="font-semibold">{selected.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order Ref</span><span className="font-mono font-bold text-primary">{orderRef}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="font-semibold">{gatewayConfig[gateway]?.label}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Account</span><span className="font-semibold text-emerald-600">✓ {email}</span></div>
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
        <Button
          className="w-full rounded-xl text-base h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            // Hard reload ensures the protected route and layout pick up the new session immediately
            window.location.href = '/patient';
          }}>
          Enter My Patient Portal →
        </Button>
        <p className="text-xs text-muted-foreground">
          If you're prompted to log in, use <strong>{email}</strong> and the password you just created.
        </p>
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

        {/* ─── SECTION 1: Identity ─── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secure Your Account</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Create Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="Min 6 characters" />
            {password.length > 0 && password.length < 6 && (
              <p className="text-xs text-amber-500 font-semibold flex items-center gap-1">⚠ Password must be at least 6 characters ({6 - password.length} more needed)</p>
            )}
            {password.length >= 6 && (
              <p className="text-xs text-emerald-600 font-semibold">✓ Password strength OK</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sex at Birth</label>
              <select value={sex} onChange={e => setSex(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary">
                <option value="">Select...</option>
                <option>Male</option><option>Female</option><option>Intersex</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="(555) 000-0000" />
          </div>
        </div>

        {/* ─── SECTION 2: Physical Vitals ─── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-2">Physical Vitals</p>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Height (ft)</label>
              <input type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="5" min="3" max="8" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Height (in)</label>
              <input type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="8" min="0" max="11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Weight (lbs)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="165" />
            </div>
          </div>
          {heightFt && heightIn && weight && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              BMI: {(((parseFloat(weight)) / Math.pow((parseInt(heightFt)*12 + parseInt(heightIn)), 2)) * 703).toFixed(1)} — auto-calculated for your clinician
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hair Color</label>
              <select value={hairColor} onChange={e => setHairColor(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary">
                <option value="">Select...</option>
                {["Black","Dark Brown","Brown","Light Brown","Blonde","Red","Auburn","Grey","White","Bald/None"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Eye Color</label>
              <select value={eyeColor} onChange={e => setEyeColor(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary">
                <option value="">Select...</option>
                {["Brown","Hazel","Green","Blue","Grey","Amber","Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Blood Type</label>
            <select value={bloodType} onChange={e => setBloodType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary">
              <option value="">Select or unknown...</option>
              {["A+","A−","B+","B−","AB+","AB−","O+","O−","Unknown"].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* ─── SECTION 3: Medical History ─── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-2">Medical History</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Known Allergies</label>
            <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="Penicillin, Sulfa, Latex... or None" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current Medications & Supplements</label>
            <textarea rows={2} value={currentMeds} onChange={e => setCurrentMeds(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary resize-none" placeholder="List all current medications and supplements..." />
          </div>
        </div>

        {/* ─── SECTION 4: Shipping Address ─── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-2">Shipping Address</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Street Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="City" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">State</label>
              <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="CA" maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">ZIP</label>
              <input type="text" value={zip} onChange={e => setZip(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="90210" />
            </div>
          </div>
        </div>

        {/* ─── SECTION 5: ID + Terms ─── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Government-Issued ID <span className="text-muted-foreground/60 normal-case font-medium">(Driver's License or Passport)</span></label>
          <label className="flex items-center gap-3 w-full border-2 border-dashed border-border rounded-xl px-4 py-4 cursor-pointer hover:border-primary transition-colors">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{idFile ? <span className="text-emerald-600 font-semibold">✓ {idFile.name}</span> : "Click to upload ID photo"}</span>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setIdFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I agree to Peak Health's <span className="text-primary font-semibold underline">Terms of Service</span> and <span className="text-primary font-semibold underline">HIPAA Privacy Policy</span>. I consent to telehealth services and electronic prescriptions.
          </span>
        </label>

        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 leading-relaxed">Your health data is stored securely in our HIPAA-compliant, military-grade encrypted database. We will never share your medical history.</p>
        </div>

        {/* Show missing required fields */}
        {(() => {
          const missing: string[] = [];
          if (!firstName || !lastName) missing.push("Full name");
          if (!email || !email.includes('@')) missing.push("Valid email address");
          if (!password || password.length < 6) missing.push("Password (min 6 characters)");
          if (!agreedToTerms) missing.push("Agreement to Terms of Service");
          return missing.length > 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-1">
              <p className="font-bold">Please complete the following:</p>
              {missing.map(m => <p key={m} className="flex items-center gap-1.5">• {m}</p>)}
            </div>
          ) : null;
        })()}

        <Button className="w-full rounded-xl h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white"
          disabled={!dob || !sex || !password || password.length < 6 || !agreedToTerms}
          onClick={() => setStage("questionnaire")}>
          Continue to Medical Questionnaire <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  if (stage === "payment" && selected) {
    // Format card number with spaces every 4 digits for display
    const formattedCard = cardNum.replace(/(.{4})/g, '$1 ').trim();
    const cardReady = gateway === 'stripe'
      ? (cardNum.length === 16 && cardExpiry.length === 5 && cardCvc.length === 3)
      : !!gateway;

    return (
      <div className="max-w-md mx-auto space-y-5">
        <div className="flex justify-center mb-6">
           <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain" />
        </div>
        <button onClick={() => setStage("account_setup")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Basic Info Collection for Payment linking */}
        <div className="space-y-4 mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Information</p>
          <div className="grid grid-cols-2 gap-3">
             <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white" />
             <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white" />
          </div>
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white" />
        </div>

        {/* Order summary */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.category} · {firstName} {lastName}</p>
            </div>
            <span className="font-extrabold text-primary text-lg">{selected.price}</span>
          </CardContent>
        </Card>

        {/* Step 1: Choose payment method */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">1. Select Payment Method</p>
          <div className="space-y-2">
            {selected.gateways.map(gw => (
              <button key={gw} onClick={() => setGateway(gw)}
                className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                  gateway === gw ? "border-primary bg-primary/5" : gatewayConfig[gw]?.color || "border-border")}>
                <span className="text-2xl">{gatewayConfig[gw]?.icon}</span>
                <span className="font-semibold text-sm">{gatewayConfig[gw]?.label}</span>
                {gateway === gw && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Card details — always visible once a gateway is selected */}
        {gateway && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
              2. {gateway === 'stripe' ? 'Enter Card Details' : `${gatewayConfig[gateway]?.label} — Card Details`}
            </p>

            {/* Visual card preview */}
            <div className="relative h-36 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-5 mb-4 overflow-hidden shadow-xl">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_60%)]" />
              <div className="flex justify-between items-start">
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Peak Health Pay</span>
                <CreditCard className="h-6 w-6 text-white/50" />
              </div>
              <p className="text-white font-mono text-lg tracking-[0.2em] mt-3 font-bold">
                {cardNum ? formattedCard.padEnd(19, '·').replace(/·/g, ' ·').replace(/ ·/g, '·') : '•••• •••• •••• ••••'}
              </p>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-white/40 text-[8px] uppercase tracking-wide">Cardholder</p>
                  <p className="text-white text-sm font-bold">{firstName && lastName ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}` : 'YOUR NAME'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[8px] uppercase tracking-wide">Expires</p>
                  <p className="text-white text-sm font-bold font-mono">{cardExpiry || 'MM/YY'}</p>
                </div>
              </div>
            </div>

            <Card className="border-border">
              <CardContent className="p-4 space-y-4">
                {/* Card number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formattedCard}
                      onChange={e => setCardNum(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary bg-white text-gray-900 tracking-widest"
                    />
                    {cardNum.length === 16 && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />}
                  </div>
                </div>

                {/* Expiry + CVC side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Expiry Date</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                        setCardExpiry(v);
                      }}
                      placeholder="MM / YY"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">CVC / CVV</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="3 digits"
                        className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary bg-background"
                      />
                      <span className="absolute right-3 top-3 text-[10px] text-muted-foreground font-bold">CVV</span>
                    </div>
                  </div>
                </div>

                {/* Helper tip */}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-emerald-500" />
                  Your card details are encrypted and never stored on our servers.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          256-bit SSL encryption · HIPAA compliant · Cancel anytime
        </div>

        <Button
          className="w-full rounded-xl h-12 text-base font-bold relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={!cardReady || isPaying || !firstName || !lastName || !email.includes('@')}
          onClick={() => {
            setIsPaying(true);
            setTimeout(() => {
              setIsPaying(false);
              setStage("account_setup");
            }, 1500);
          }}>
          {isPaying ? (
            <span className="flex items-center gap-2">
              Processing Payment... <Zap className="h-4 w-4 animate-pulse" />
            </span>
          ) : (
            <><CreditCard className="h-5 w-5 mr-2" /> Pay {selected.price} &amp; Continue</>
          )}
        </Button>

        {!gateway && <p className="text-xs text-center text-muted-foreground">Select a payment method above to continue</p>}
        {gateway === 'stripe' && cardNum.length > 0 && cardNum.length < 16 && (
          <p className="text-amber-500 text-xs text-center">{16 - cardNum.length} more digits needed</p>
        )}
        {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}
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
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary"
                placeholder="Your answer..." onChange={e => handleAnswer(currentQ.id, e.target.value)} />
            )}
            {currentQ.type === "number" && (
              <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary"
                placeholder="0" onChange={e => handleAnswer(currentQ.id, e.target.value)} />
            )}
            {currentQ.type === "textarea" && (
              <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary resize-none"
                placeholder="Describe in detail..." onChange={e => handleAnswer(currentQ.id, e.target.value)} />
            )}
            {currentQ.type === "select" && (
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary"
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
          onClick={() => {
            if (qStep < totalQ - 1) {
              setQStep(s => s + 1);
            } else {
              setStage("scheduling");
            }
          }}>
          {qStep < totalQ - 1 ? "Continue" : "Next: Consultation Preference"} <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  if (stage === "scheduling" && selected) {
    const dates = ["Today", "Tomorrow", "Wed", "Thu", "Fri", "Sat"];
    const times = ["9:00 AM", "10:30 AM", "12:00 PM", "1:00 PM", "2:45 PM", "4:00 PM"];
    return (
      <div className="max-w-md mx-auto space-y-5">
        <div className="flex justify-center mb-6">
           <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain" />
        </div>
        <button onClick={() => setStage("questionnaire")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold">Zoom Consultation</h1>
          <p className="text-sm text-muted-foreground">Would you like a video consultation with your doctor?</p>
        </div>

        {/* Zoom preference choice */}
        <div className="space-y-3">
          <button onClick={() => { setZoomWanted(true); }}
            className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
              zoomWanted === true ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Video className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Yes, I want a Zoom consultation</p>
              <p className="text-xs text-muted-foreground">Choose a date and time for your video visit with the doctor</p>
            </div>
            {zoomWanted === true && <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />}
          </button>

          <button onClick={() => { setZoomWanted(false); setConsultationTime(""); setSelectedDate(""); setSelectedTime(""); }}
            className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
              zoomWanted === false ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-400/40")}>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-sm">No, asynchronous review is fine</p>
              <p className="text-xs text-muted-foreground">Doctor reviews your intake and sends prescription — no meeting needed</p>
            </div>
            {zoomWanted === false && <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto shrink-0" />}
          </button>
        </div>

        {/* Date/time picker — only when zoom wanted */}
        {zoomWanted === true && (
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Select Date</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {dates.map(d => (
                    <button key={d} onClick={() => { setSelectedDate(d); setConsultationTime(selectedTime ? `${d} at ${selectedTime}` : ""); }}
                      className={cn("shrink-0 px-4 py-2 border rounded-xl text-sm font-semibold transition-all",
                        selectedDate === d ? "border-primary bg-primary text-white" : "hover:border-primary")}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Select Time (EST)</p>
                <div className="grid grid-cols-3 gap-2">
                  {times.map(t => (
                    <button key={t} onClick={() => { setSelectedTime(t); setConsultationTime(selectedDate ? `${selectedDate} at ${t}` : `at ${t}`); }}
                      className={cn("px-3 py-2 border rounded-xl text-xs font-semibold transition-all",
                        selectedTime === t ? "border-primary bg-primary text-white" : "hover:border-primary")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {consultationTime && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700">
                  <Video className="h-4 w-4" />
                  Zoom requested: {consultationTime} — doctor will confirm
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">ID Verification Required</p>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
               <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Upload a photo of your government ID</p>
              <input type="file" className="mt-2 text-xs" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          {idFile && (
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 italic">✓ {idFile.name} attached</p>
          )}
        </div>

        <Button className="w-full rounded-xl h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={zoomWanted === null || (zoomWanted === true && !consultationTime) || !idFile || isSubmitting}
          onClick={() => handleCompleteSetup()}>
          {isSubmitting ? "Finishing..." : "Complete Enrollment →"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      {/* Shop Header with Back button */}
      <div className="flex items-center justify-between mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/patient')}
          className="rounded-xl text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Portal
        </Button>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Medical Dispensary</span>
      </div>

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
