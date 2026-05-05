import { useState } from "react";
import {
  ChevronRight, CheckCircle2, CreditCard,
  Star, Shield, Clock, Package, ArrowLeft, Globe, Zap
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

const products = [
  {
    id: 1, name: "Weight Loss — GLP-1 Injection", category: "Weight Loss",
    tagline: "Semaglutide · weekly injection", price: "$199/mo", priceUSD: 199,
    rating: 4.9, reviews: 3241, badge: "Most Popular",
    image: IMG("1490645935967-10de6ba17061"),
    description: "Clinician-supervised weight management with weekly check-ins and compounded GLP-1 medication if prescribed.",
    questionnaire: [
      { id: "q1", label: "What is your current weight (lbs)?", type: "number", required: true },
      { id: "q2", label: "Have you tried weight loss medications before?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q3", label: "Do you have any of the following? (select all)", type: "checkbox", options: ["Type 2 Diabetes", "High Blood Pressure", "Heart Disease", "None"], required: true },
      { id: "q4", label: "Describe your weight loss goals", type: "textarea", required: true },
    ],
    gateways: ["stripe", "paypal", "apple_pay", "klarna"],
  },
  {
    id: 2, name: "Weight Loss — Oral Daily", category: "Weight Loss",
    tagline: "Metformin / Bupropion-Naltrexone", price: "$89/mo", priceUSD: 89,
    rating: 4.7, reviews: 1422, badge: "Needle-free",
    image: IMG("1505576399279-565b52d4ac71"),
    description: "Daily oral weight management for patients who prefer pills over injections. Metabolic + appetite support.",
    questionnaire: [
      { id: "q1", label: "Current weight (lbs)?", type: "number", required: true },
      { id: "q2", label: "Are you pregnant or breastfeeding?", type: "radio", options: ["Yes", "No", "N/A"], required: true },
      { id: "q3", label: "Any seizure history or eating disorder?", type: "radio", options: ["Yes", "No"], required: true },
    ],
    gateways: ["stripe", "paypal", "apple_pay"],
  },
  {
    id: 3, name: "ED Treatment", category: "Sexual Wellness",
    tagline: "Sildenafil / Tadalafil — discreet delivery", price: "$49/mo", priceUSD: 49,
    rating: 4.8, reviews: 5102, badge: "Discreet",
    image: IMG("1631549916768-4119b2e5f926"),
    description: "FDA-approved ED medications prescribed online and shipped in plain packaging within 2–3 days.",
    questionnaire: [
      { id: "q1", label: "How long have you experienced ED symptoms?", type: "select", options: ["< 6 months", "6–12 months", "1–2 years", "2+ years"], required: true },
      { id: "q2", label: "Do you take nitrates or blood pressure medications?", type: "radio", options: ["Yes", "No", "Not sure"], required: true },
      { id: "q3", label: "Any history of heart attack or stroke?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Current medications (list all)", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal"],
  },
  {
    id: 4, name: "Premature Ejaculation", category: "Sexual Wellness",
    tagline: "Sertraline / Lidocaine spray", price: "$39/mo", priceUSD: 39,
    rating: 4.6, reviews: 812, badge: null,
    image: IMG("1582719471384-894fbb16e074"),
    description: "Clinically proven oral and topical treatments for PE. Reviewed by licensed urologists.",
    questionnaire: [
      { id: "q1", label: "Average time to ejaculation?", type: "select", options: ["< 1 min", "1–2 min", "2–4 min", "4+ min"], required: true },
      { id: "q2", label: "Currently on SSRIs or other antidepressants?", type: "radio", options: ["Yes", "No"], required: true },
    ],
    gateways: ["stripe", "paypal", "apple_pay"],
  },
  {
    id: 5, name: "Hair Loss Treatment", category: "Hair",
    tagline: "Finasteride + Minoxidil combo", price: "$39/mo", priceUSD: 39,
    rating: 4.7, reviews: 2890, badge: null,
    image: IMG("1522337360788-8b13dee7a37e"),
    description: "Clinically proven hair regrowth treatment prescribed by licensed dermatologists. Topical + oral options.",
    questionnaire: [
      { id: "q1", label: "How long have you noticed hair thinning?", type: "select", options: ["< 1 year", "1–3 years", "3–5 years", "5+ years"], required: true },
      { id: "q2", label: "Family history of hair loss?", type: "radio", options: ["Yes — Father", "Yes — Mother", "Both", "No"], required: true },
      { id: "q3", label: "Upload a photo of your hairline (optional)", type: "text", required: false },
    ],
    gateways: ["stripe", "apple_pay", "google_pay"],
  },
  {
    id: 6, name: "Sleep Aid", category: "Sleep",
    tagline: "Doxepin / Trazodone — non-habit forming", price: "$59/mo", priceUSD: 59,
    rating: 4.8, reviews: 1654, badge: "Fast Rx",
    image: IMG("1541781774459-bb2af2f05b55"),
    description: "Prescription sleep medications and natural alternatives. Reviewed by sleep-medicine specialists.",
    questionnaire: [
      { id: "q1", label: "How many hours of sleep per night?", type: "select", options: ["< 4", "4–6", "6–8", "8+"], required: true },
      { id: "q2", label: "Difficulty falling asleep or staying asleep?", type: "radio", options: ["Falling", "Staying", "Both"], required: true },
      { id: "q3", label: "Caffeine intake per day?", type: "select", options: ["None", "1–2 cups", "3–5 cups", "5+ cups"], required: true },
    ],
    gateways: ["stripe", "paypal", "apple_pay"],
  },
  {
    id: 7, name: "Anxiety Care", category: "Mental Health",
    tagline: "Buspirone / Hydroxyzine — same-day Rx", price: "$79/mo", priceUSD: 79,
    rating: 4.8, reviews: 1876, badge: "Fast Rx",
    image: IMG("1499209974431-9dddcece7f88"),
    description: "Licensed psychiatrists review your intake and prescribe within hours. Includes unlimited messaging.",
    questionnaire: [
      { id: "q1", label: "PHQ-4: Over the last 2 weeks, how often have you felt nervous or anxious?", type: "radio", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], required: true },
      { id: "q2", label: "Are you currently taking any psychiatric medications?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q3", label: "Have you been hospitalized for mental health reasons?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Describe what you're experiencing", type: "textarea", required: true },
    ],
    gateways: ["stripe", "paypal", "google_pay"],
  },
  {
    id: 8, name: "Skincare — Tretinoin", category: "Skincare",
    tagline: "Custom prescription topical", price: "$45/mo", priceUSD: 45,
    rating: 4.9, reviews: 4210, badge: "Dermatologist",
    image: IMG("1556228720-195a672e8a03"),
    description: "Custom-compounded tretinoin formulas for acne, anti-aging, and pigmentation, prescribed by dermatologists.",
    questionnaire: [
      { id: "q1", label: "Primary skin concern?", type: "select", options: ["Acne", "Anti-aging", "Dark spots", "Combination"], required: true },
      { id: "q2", label: "Skin type?", type: "radio", options: ["Oily", "Dry", "Combination", "Sensitive"], required: true },
      { id: "q3", label: "Currently using retinoids?", type: "radio", options: ["Yes", "No"], required: true },
    ],
    gateways: ["stripe", "apple_pay", "google_pay", "paypal"],
  },
  {
    id: 9, name: "Testosterone Therapy", category: "Hormone",
    tagline: "TRT — physician-supervised", price: "$249/mo", priceUSD: 249,
    rating: 4.7, reviews: 612, badge: "Lab included",
    image: IMG("1559757175-5700dde675bc"),
    description: "Comprehensive TRT with at-home lab testing, dosing protocol, and quarterly follow-ups.",
    questionnaire: [
      { id: "q1", label: "Have you had testosterone labs in the last 6 months?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q2", label: "Symptoms experienced? (select all)", type: "checkbox", options: ["Low energy", "Low libido", "Mood changes", "Muscle loss"], required: true },
      { id: "q3", label: "Any history of prostate issues?", type: "radio", options: ["Yes", "No"], required: true },
    ],
    gateways: ["stripe", "klarna"],
  },
  {
    id: 10, name: "Daily Multivitamin Pack", category: "Daily Wellness",
    tagline: "Personalized vitamin & supplement plan", price: "$29/mo", priceUSD: 29,
    rating: 4.6, reviews: 928, badge: null,
    image: IMG("1584308666744-24d5c474f2ae"),
    description: "Custom daily vitamin packs based on your goals and bloodwork. Free shipping every 30 days.",
    questionnaire: [
      { id: "q1", label: "Top wellness goal?", type: "select", options: ["Energy", "Immunity", "Skin & Hair", "Sleep", "General"], required: true },
      { id: "q2", label: "Dietary preference?", type: "radio", options: ["No restriction", "Vegetarian", "Vegan", "Keto"], required: true },
    ],
    gateways: ["stripe", "paypal", "apple_pay", "google_pay"],
  },
];

const categories = ["All", "Weight Loss", "Sexual Wellness", "Hair", "Sleep", "Mental Health", "Skincare", "Hormone", "Daily Wellness"] as const;

const categoryTint: Record<string, string> = {
  "Weight Loss": "from-[var(--brand-sage-50)] to-[var(--brand-sage-100)]",
  "Sexual Wellness": "from-[var(--brand-lavender-50)] to-[var(--brand-lavender-100)]",
  "Hair": "from-[var(--brand-peach-50)] to-[var(--brand-peach-100)]",
  "Sleep": "from-[var(--brand-lavender-50)] to-[var(--brand-sky-50)]",
  "Mental Health": "from-[var(--brand-sage-50)] to-[var(--brand-lavender-50)]",
  "Skincare": "from-[var(--brand-peach-50)] to-[var(--brand-lavender-50)]",
  "Hormone": "from-[var(--brand-sky-50)] to-[var(--brand-lavender-100)]",
  "Daily Wellness": "from-[var(--brand-sage-50)] to-[var(--brand-peach-50)]",
};

const gatewayConfig: Record<string, { label: string; icon: string; color: string }> = {
  stripe: { label: "Credit / Debit Card", icon: "💳", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  paypal: { label: "PayPal", icon: "🅿️", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  apple_pay: { label: "Apple Pay", icon: "🍎", color: "border-gray-400 bg-gray-50 dark:bg-gray-950/30" },
  google_pay: { label: "Google Pay", icon: "🔵", color: "border-green-400 bg-green-50 dark:bg-green-950/30" },
  klarna: { label: "Klarna · Pay in 4", icon: "🛍️", color: "border-pink-300 bg-pink-50 dark:bg-pink-950/30" },
};

type Stage = "catalog" | "questionnaire" | "payment" | "confirmed";

export function PatientShopPage() {
  const [stage, setStage] = useState<Stage>("catalog");
  const [selected, setSelected] = useState<typeof products[0] | null>(null);
  const [qStep, setQStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [gateway, setGateway] = useState<string>("");
  const [orderRef] = useState(() => "RX-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [activeCat, setActiveCat] = useState<typeof categories[number]>("All");
  const filteredProducts = activeCat === "All" ? products : products.filter(p => p.category === activeCat);

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

  if (stage === "confirmed" && selected) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 pt-8">
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Order Confirmed!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your intake has been submitted for doctor review.</p>
        </div>
        <Card className="text-left">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Product</span><span className="font-semibold">{selected.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order Ref</span><span className="font-mono font-bold text-primary">{orderRef}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="font-semibold">{gatewayConfig[gateway]?.label}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold">{selected.price}</span></div>
          </CardContent>
        </Card>
        <div className="bg-secondary/40 border border-secondary rounded-2xl p-4 text-sm text-secondary-foreground text-left">
          <p className="font-semibold mb-1">⏱ What happens next?</p>
          <ol className="space-y-1 text-xs list-decimal list-inside opacity-90">
            <li>A licensed doctor reviews your intake (usually within 2–4 hrs)</li>
            <li>If approved, your prescription is sent to our pharmacy</li>
            <li>Medication ships within 1–2 business days with tracking</li>
          </ol>
        </div>
        <div className="bg-accent/30 border border-accent rounded-2xl p-4 text-left">
          <p className="font-bold text-sm">Create your account to track this order</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            Save your intake, message your doctor, and view shipping updates.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button className="rounded-xl text-xs" onClick={() => { setStage("catalog"); setSelected(null); }}>
              Create Account
            </Button>
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => { setStage("catalog"); setSelected(null); }}>
              Sign In
            </Button>
          </div>
        </div>
        <Button variant="ghost" className="w-full rounded-xl text-xs" onClick={() => { setStage("catalog"); setSelected(null); }}>
          Continue as guest — Back to Shop
        </Button>
      </div>
    );
  }

  if (stage === "payment" && selected) {
    return (
      <div className="max-w-md mx-auto space-y-5">
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          256-bit SSL encryption · HIPAA compliant · Cancel anytime
        </div>
        <Button className="w-full rounded-xl h-12 text-base font-bold" disabled={!gateway}
          onClick={() => setStage("confirmed")}>
          <CreditCard className="h-5 w-5 mr-2" /> Confirm & Pay {selected.price}
        </Button>
      </div>
    );
  }

  if (stage === "questionnaire" && selected && currentQ) {
    return (
      <div className="max-w-md mx-auto space-y-5">
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
          onClick={() => qStep < totalQ - 1 ? setQStep(q => q + 1) : setStage("payment")}>
          {qStep < totalQ - 1 ? "Continue" : "Review & Pay"} <ChevronRight className="h-4 w-4 ml-1" />
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
