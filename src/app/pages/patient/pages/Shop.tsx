import { useState } from "react";
import {
  ShoppingCart, ChevronRight, CheckCircle2, CreditCard, X,
  Star, Shield, Clock, Package, ArrowLeft, Globe, Zap
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const products = [
  {
    id: 1, name: "Weight Loss Program", category: "GLP-1 / Metabolic",
    tagline: "Semaglutide-based treatment plan", price: "$199/mo", priceUSD: 199,
    rating: 4.9, reviews: 3241, badge: "Most Popular",
    description: "Clinician-supervised weight management with weekly check-ins and compounded medication if prescribed.",
    questionnaire: [
      { id: "q1", label: "What is your current weight (lbs)?", type: "number", required: true },
      { id: "q2", label: "Have you tried weight loss medications before?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q3", label: "Do you have any of the following? (select all)", type: "checkbox", options: ["Type 2 Diabetes", "High Blood Pressure", "Heart Disease", "None"], required: true },
      { id: "q4", label: "Describe your weight loss goals", type: "textarea", required: true },
    ],
    gateways: ["stripe", "paypal", "apple_pay"],
  },
  {
    id: 2, name: "ED Treatment", category: "Men's Health",
    tagline: "Sildenafil / Tadalafil — discreet delivery", price: "$49/mo", priceUSD: 49,
    rating: 4.8, reviews: 5102, badge: "Discreet",
    description: "FDA-approved medications prescribed online and shipped in plain packaging within 2–3 days.",
    questionnaire: [
      { id: "q1", label: "How long have you experienced ED symptoms?", type: "select", options: ["< 6 months", "6–12 months", "1–2 years", "2+ years"], required: true },
      { id: "q2", label: "Do you take nitrates or blood pressure medications?", type: "radio", options: ["Yes", "No", "Not sure"], required: true },
      { id: "q3", label: "Any history of heart attack or stroke?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Current medications (list all)", type: "textarea", required: false },
    ],
    gateways: ["stripe", "paypal"],
  },
  {
    id: 3, name: "Hair Loss Treatment", category: "Dermatology",
    tagline: "Finasteride + Minoxidil combo", price: "$39/mo", priceUSD: 39,
    rating: 4.7, reviews: 2890, badge: null,
    description: "Clinically proven hair regrowth treatment prescribed by licensed dermatologists.",
    questionnaire: [
      { id: "q1", label: "How long have you noticed hair thinning?", type: "select", options: ["< 1 year", "1–3 years", "3–5 years", "5+ years"], required: true },
      { id: "q2", label: "Family history of hair loss?", type: "radio", options: ["Yes — Father", "Yes — Mother", "Both", "No"], required: true },
      { id: "q3", label: "Upload a photo of your hairline (optional)", type: "text", required: false },
    ],
    gateways: ["stripe", "apple_pay", "google_pay"],
  },
  {
    id: 4, name: "Anxiety & Sleep", category: "Mental Health",
    tagline: "Buspirone / Hydroxyzine — same-day Rx", price: "$79/mo", priceUSD: 79,
    rating: 4.8, reviews: 1876, badge: "Fast Rx",
    description: "Licensed psychiatrists review your intake and prescribe within hours. Includes unlimited messaging.",
    questionnaire: [
      { id: "q1", label: "PHQ-4: Over the last 2 weeks, how often have you felt nervous or anxious?", type: "radio", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], required: true },
      { id: "q2", label: "Are you currently taking any psychiatric medications?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q3", label: "Have you been hospitalized for mental health reasons?", type: "radio", options: ["Yes", "No"], required: true },
      { id: "q4", label: "Describe what you're experiencing", type: "textarea", required: true },
    ],
    gateways: ["stripe", "paypal", "google_pay"],
  },
];

const gatewayConfig: Record<string, { label: string; icon: string; color: string }> = {
  stripe: { label: "Credit / Debit Card", icon: "💳", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  paypal: { label: "PayPal", icon: "🅿️", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  apple_pay: { label: "Apple Pay", icon: "🍎", color: "border-gray-400 bg-gray-50 dark:bg-gray-950/30" },
  google_pay: { label: "Google Pay", icon: "🔵", color: "border-green-400 bg-green-50 dark:bg-green-950/30" },
};

type Stage = "catalog" | "questionnaire" | "payment" | "confirmed";

export function PatientShopPage() {
  const [stage, setStage] = useState<Stage>("catalog");
  const [selected, setSelected] = useState<typeof products[0] | null>(null);
  const [qStep, setQStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [gateway, setGateway] = useState<string>("");
  const [orderRef] = useState(() => "RX-" + Math.random().toString(36).slice(2, 8).toUpperCase());

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
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 text-sm text-violet-800 dark:text-violet-300 text-left">
          <p className="font-semibold mb-1">⏱ What happens next?</p>
          <ol className="space-y-1 text-xs list-decimal list-inside opacity-90">
            <li>A licensed doctor reviews your intake (usually within 2–4 hrs)</li>
            <li>If approved, your prescription is sent to our pharmacy</li>
            <li>Medication ships within 1–2 business days with tracking</li>
          </ol>
        </div>
        <Button className="w-full rounded-xl" onClick={() => { setStage("catalog"); setSelected(null); }}>
          Back to Shop
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
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Treatment Programs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Doctor-reviewed, pharmacy-fulfilled — shipped worldwide</p>
      </div>

      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3">
        <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          Ships to 40+ countries · Multi-currency checkout · Licensed in your jurisdiction
        </p>
      </div>

      <div className="space-y-3">
        {products.map(product => (
          <Card key={product.id} className="hover:border-primary/40 transition-all cursor-pointer overflow-hidden"
            onClick={() => startFlow(product)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{product.name}</p>
                        {product.badge && (
                          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">{product.badge}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{product.category} · {product.tagline}</p>
                    </div>
                    <span className="font-extrabold text-primary text-sm shrink-0">{product.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">{product.rating}</span>
                      <span className="text-xs text-muted-foreground">({product.reviews.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {product.questionnaire.length} questions
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-amber-500" /> Fast Rx
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
