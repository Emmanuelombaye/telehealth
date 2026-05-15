import { useState, useEffect, useMemo, useCallback, useRef, type RefObject } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronRight, CheckCircle2, CreditCard,
  Star, Shield, ShieldCheck, Clock, Package, ArrowLeft, Globe, Zap, Loader2,
  Wallet,
  WalletCards,
  Smartphone,
  Lock,
  Sparkles,
  Upload,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { PatientSchedulingPanel } from "../../../components/patient/PatientSchedulingPanel.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { 
  usePatientStore, 
  generateMRN 
} from "../../../../lib/patient-store";
import {
  parseProductVideoRules,
  parseGlobalVideoStatesFromEnv,
  requiresSyncVideoVisit,
  computeNumericBmi,
  computeAgeYears,
  type ConsultRoutingRuleRow,
  type ClinicalContext,
} from "../../../../lib/videoConsultRules";
import { effectiveProductGateways, GATEWAY_DISPLAY } from "../../../../lib/productGateways";
import {
  defaultCalendlyBookingPageUrl,
  toSchedulingIframeSrc,
  toSchedulingOpenTabUrl,
} from "../../../../lib/calendlyEmbed";
import {
  ENROLLMENT_DRAFT_KEY,
  DRAFT_MAX_AGE_MS,
  loadEnrollmentDraft,
  saveEnrollmentDraft,
  clearEnrollmentDraft,
  type EnrollmentDraftV1,
} from "../../../../lib/enrollmentDraft";
import {
  shopPathForStage,
  shopStageFromStepParam,
  getClientFlowRowByDiagramStep,
  type ShopFlowStage,
} from "../../../../lib/patientShopRoutes";
import { PatientEnrollmentStepper } from "../../../components/PatientEnrollmentStepper.tsx";
import { PatientBrandMark } from "../../../components/patient/PatientBrandMark.tsx";
import { PatientShopTopChrome } from "../../../components/patient/PatientShopTopChrome.tsx";
import { motion } from "framer-motion";
// Stripe
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey && import.meta.env.DEV) {
  console.warn("⚠️ VITE_STRIPE_PUBLISHABLE_KEY is missing. Stripe Elements will not load.");
}
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// ── Stripe PaymentElement inner form ─────────────────────────────────────────
function StripePaymentForm({
  priceUSD,
  firstName,
  lastName,
  email,
  productName,
  onSuccess,
  onError,
}: {
  priceUSD: number;
  firstName: string;
  lastName: string;
  email: string;
  productName: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: `${firstName} ${lastName}`.trim(),
              email,
            },
          },
          // We handle redirect ourselves — return_url is for 3DS redirect only
          return_url: window.location.href,
        },
        redirect: "if_required",
      });
      if (result.error) {
        onError(result.error.message ?? "Payment failed.");
      } else if (result.paymentIntent?.status === "succeeded") {
        onSuccess(result.paymentIntent.id);
      } else {
        onError("Payment incomplete. Please try again.");
      }
    } catch (e: any) {
      onError(e.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-5">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button
        className="w-full rounded-xl h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
        disabled={!stripe || !elements || paying || !firstName || !lastName || !email.includes('@')}
        onClick={handlePay}
      >
        {paying ? (
          <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing Payment...</span>
        ) : (
          <><CreditCard className="h-5 w-5 mr-2" /> Pay ${priceUSD}/mo & Continue</>
        )}
      </Button>
    </div>
  );
}

function gatewayTileIcon(gw: string) {
  const iconCls = "h-7 w-7 shrink-0";
  switch (gw) {
    case "stripe":
      return <CreditCard className={cn(iconCls, "text-violet-600")} aria-hidden />;
    case "paypal":
      return <Wallet className={cn(iconCls, "text-sky-600")} aria-hidden />;
    case "apple_pay":
      return <Smartphone className={cn(iconCls, "text-white drop-shadow-sm")} aria-hidden />;
    case "google_pay":
      return <WalletCards className={cn(iconCls, "text-blue-600")} aria-hidden />;
    default:
      return (
        <span className="text-2xl shrink-0 leading-none" aria-hidden>
          {GATEWAY_DISPLAY[gw]?.icon ?? "💳"}
        </span>
      );
  }
}

const ALT_HEADER_GRADIENT: Record<string, string> = {
  paypal: "from-[#001435] via-[#0070ba] to-sky-400",
  apple_pay: "from-zinc-950 via-zinc-800 to-zinc-600",
  google_pay: "from-blue-600 via-emerald-500 to-amber-300",
  klarna: "from-pink-600 via-rose-500 to-orange-400",
};

function AltGatewayReadinessPanel({
  gatewayId,
  displayName,
  priceText,
  onChooseCard,
}: {
  gatewayId: string;
  displayName: string;
  priceText: string;
  onChooseCard: () => void;
}) {
  const bar = ALT_HEADER_GRADIENT[gatewayId] ?? "from-slate-800 to-slate-600";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.08]"
    >
      <div className={cn("h-1.5 w-full bg-gradient-to-r", bar)} />
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Wallet checkout</p>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{displayName}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Final connection for this wallet is still being switched on. Use card checkout to complete your enrollment
              today.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3 flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Due today</span>
          <span className="font-extrabold text-emerald-700 tabular-nums">{priceText}</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-2">
          <li className="flex gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
            <span>When this wallet goes live, you will authorise in one tap without retyping your card.</span>
          </li>
          <li className="flex gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
            <span>Same encrypted session and order record as card payments.</span>
          </li>
        </ul>
        <Button
          type="button"
          className="w-full rounded-xl h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10"
          onClick={onChooseCard}
        >
          <CreditCard className="h-4 w-4 mr-2" /> Pay with card instead
        </Button>
      </div>
    </motion.div>
  );
}

const ID_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf" as const;

function EnrollmentIdUploadPanel({
  idAccept,
  idFile,
  setIdFile,
  identityStripeCompleted,
  setError,
  idUploadInputRef,
  onOpenStripeIdentity,
  embedded,
}: {
  idAccept: string;
  idFile: File | null;
  setIdFile: (f: File | null) => void;
  identityStripeCompleted: boolean;
  setError: (msg: string | null) => void;
  idUploadInputRef: RefObject<HTMLInputElement | null>;
  onOpenStripeIdentity: () => void;
  /** When true, panel sits inside the last question card (divider + compact header). */
  embedded?: boolean;
}) {
  if (identityStripeCompleted) {
    return (
      <div
        className={cn(
          embedded && "mt-6 border-t-2 border-emerald-100 pt-6",
          "rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 dark:border-emerald-800 dark:bg-emerald-950/50",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-emerald-900/80">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-300" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Identity verified</p>
            <p className="text-xs text-emerald-800/90 dark:text-emerald-200/90">Stripe Identity is complete — you can submit enrollment.</p>
          </div>
        </div>
      </div>
    );
  }

  const pickFile = () => idUploadInputRef.current?.click();

  return (
    <div className={cn(embedded && "mt-6 border-t-2 border-dashed border-emerald-200/90 pt-6", "space-y-4")}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-900/15">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
              Required to submit
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ID verification</span>
          </div>
          <h2 className="text-base font-black text-[#0A0D14] dark:text-white">Upload a photo of your government ID</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Driver license, state ID, or passport — legible, full frame, no glare. JPG, PNG, WebP, or PDF, up to 12 MB.
          </p>
        </div>
      </div>

      <input
        ref={idUploadInputRef}
        id="gov-id-upload-shop"
        type="file"
        className="sr-only"
        accept={idAccept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            if (f.size > 12 * 1024 * 1024) {
              setError("Please choose an ID file under 12 MB.");
              e.target.value = "";
              return;
            }
            setError(null);
            setIdFile(f);
          }
        }}
      />

      <div
        className="overflow-hidden rounded-2xl border-2 border-dashed border-emerald-400/70 bg-gradient-to-b from-emerald-50 via-white to-slate-50/80 p-5 shadow-inner dark:border-emerald-500/40 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-slate-950/80"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const f = e.dataTransfer.files?.[0];
          if (!f) return;
          if (!idAccept.split(",").some((t) => f.type === t.trim())) {
            setError("Please drop a JPG, PNG, WebP, or PDF file.");
            return;
          }
          if (f.size > 12 * 1024 * 1024) {
            setError("Please choose an ID file under 12 MB.");
            return;
          }
          setError(null);
          setIdFile(f);
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-emerald-100 dark:bg-emerald-900/50 dark:ring-emerald-700/50">
            <Upload className="h-8 w-8 text-emerald-600 dark:text-emerald-300" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <label htmlFor="gov-id-upload-shop" className="block cursor-pointer space-y-2 text-left">
              <p className="text-sm font-bold text-[#0A0D14] dark:text-white">
                {idFile ? idFile.name : "Drag and drop your ID here, or use Choose file."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your file stays encrypted in transit. We use it only for clinician verification.</p>
            </label>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Button
                type="button"
                className="rounded-xl bg-emerald-600 px-6 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"
                onClick={pickFile}
              >
                Choose file
              </Button>
            </div>
          </div>
        </div>
      </div>

      {idFile && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">ID attached — ready to submit</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto rounded-lg text-[10px]"
            onClick={() => {
              setIdFile(null);
              if (idUploadInputRef.current) idUploadInputRef.current.value = "";
            }}
          >
            Remove
          </Button>
        </div>
      )}

      <button
        type="button"
        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        onClick={onOpenStripeIdentity}
      >
        Prefer Stripe Identity? Open the identity step instead →
      </button>
    </div>
  );
}

// Products now fetched from Supabase directly

const categoryTint: Record<string, string> = {
  "Weight Loss": "from-[var(--brand-sage-50)] to-[var(--brand-sage-100)]",
  "Sexual Wellness": "from-[var(--brand-lavender-50)] to-[var(--brand-lavender-100)]",
  "Hair": "from-[var(--brand-peach-50)] to-[var(--brand-peach-100)]",
  "Sleep": "from-[var(--brand-lavender-50)] to-[var(--brand-sky-50)]",
  "Mental Health": "from-[var(--brand-sage-50)] to-[var(--brand-lavender-50)]",
  "Skincare": "from-[var(--brand-peach-50)] to-[var(--brand-lavender-50)]",
  "Hormone": "from-[var(--brand-sky-50)] to-[var(--brand-lavender-100)]",
};

export function PatientShopPage() {
  const navigate = useNavigate();
  const { step: stepParam } = useParams();

  const readInitialStage = (): ShopFlowStage => {
    if (typeof window === "undefined") return "catalog";
    const seg = window.location.pathname.replace(/^\/patient\/shop\/?/, "").split("/")[0];
    return shopStageFromStepParam(seg || undefined) ?? "catalog";
  };

  const [stage, setStageState] = useState<ShopFlowStage>(readInitialStage);
  const { initialize } = useAuthStore();
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [assignedDoctorForScheduling, setAssignedDoctorForScheduling] = useState<any>(null);
  const [schedulingDoctorLoading, setSchedulingDoctorLoading] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('active', true);
        if (error) throw error;
        const mapped = data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          tagline: p.tagline,
          price: `$${p.price_usd}/mo`,
          priceUSD: p.price_usd,
          rating: p.features?.rating || 4.9,
          reviews: p.features?.reviews || 1000,
          badge: p.features?.badge || null,
          image: p.image_url,
          description: p.description,
          questionnaire: p.features?.questionnaire || [],
          gateways: p.features?.gateways || ["stripe", "paypal", "apple_pay", "google_pay"],
          rawFeatures: p.features,
        }));
        setDbProducts(mapped);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  const [selected, setSelected] = useState<any | null>(null);
  const [qStep, setQStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [gateway, setGateway] = useState<string>("");
  const [consultationTime, setConsultationTime] = useState<string>("");
  /** Required visit: patient confirms they used the embedded scheduler (Cal / Calendly). */
  const [bookingAttestation, setBookingAttestation] = useState(false);
  // orderRef is now generated fresh at submission time — static useState caused 409 conflicts on retry
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
  const [submittedOrderRef, setSubmittedOrderRef] = useState("");
  // Payment card fields
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Verification state
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [routingRulesFromDb, setRoutingRulesFromDb] = useState<ConsultRoutingRuleRow[]>([]);
  // Stripe state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);

  /** Checkout: clinical + ship-to qualifiers before PaymentIntent / Elements. */
  const [paymentQualifiersPassed, setPaymentQualifiersPassed] = useState(false);
  const [qualifierAge18_75, setQualifierAge18_75] = useState(false);
  const [qualifierNotPregnant, setQualifierNotPregnant] = useState(false);
  const [qualifierNoMtcMen2, setQualifierNoMtcMen2] = useState(false);
  const [qualifierUsResident, setQualifierUsResident] = useState(false);
  /** Set when Stripe Identity flow completes without error (upload not required). */
  const [identityStripeCompleted, setIdentityStripeCompleted] = useState(false);
  const [resumeDraftAvailable, setResumeDraftAvailable] = useState(false);
  const saveDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idUploadInputRef = useRef<HTMLInputElement | null>(null);

  /** Set `VITE_CHECKOUT_STRIPE_ONLY=true` to hide wallet options and show card only. */
  const requireStripeOnly = import.meta.env.VITE_CHECKOUT_STRIPE_ONLY === "true";
  /** Demo card flow for non-Stripe gateways (dev, or staging with `VITE_ENABLE_DEMO_ALT_GATEWAYS=true`). */
  const allowSimulatedAltGateway =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ALT_GATEWAYS === "true";

  const hasStripePublishableKey = Boolean(stripeKey?.trim());
  /** When Stripe.js cannot load, use the same local card UI so checkout can be completed without keys. */
  const simulateNonStripeWallets = allowSimulatedAltGateway || !hasStripePublishableKey;
  const showLocalCardDemo =
    Boolean(gateway) &&
    ((gateway !== "stripe" && simulateNonStripeWallets) ||
      (gateway === "stripe" && !hasStripePublishableKey));

  useEffect(() => {
    if (!selected) return;
    const allowed = new Set(
      effectiveProductGateways(selected.gateways, { requireStripeOnly }),
    );
    if (gateway && !allowed.has(gateway)) {
      setGateway("");
      setStripeClientSecret(null);
      setStripePaymentIntentId(null);
    }
  }, [selected?.id, selected?.gateways, gateway, requireStripeOnly, selected]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("consult_routing_rules")
        .select("*")
        .eq("active", true)
        .order("priority", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn("[Shop] consult_routing_rules:", error.message);
        setRoutingRulesFromDb([]);
        return;
      }
      setRoutingRulesFromDb((data || []) as ConsultRoutingRuleRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Create Stripe PaymentIntent after qualifiers + Stripe gateway selected ──
  useEffect(() => {
    if (gateway !== "stripe" || !selected || !paymentQualifiersPassed || !stripePromise) return;
    if (stripeClientSecret) return;
    let cancelled = false;
    (async () => {
      try {
        const amountCents = Math.round((selected.priceUSD ?? 0) * 100);
        const { data, error } = await supabase.functions.invoke("create-payment-intent", {
          body: {
            amount: amountCents,
            currency: "usd",
            metadata: {
              product_id: selected.id,
              product_name: selected.name,
              customer_email: email,
            },
          },
        });
        if (cancelled) return;
        if (error || !data?.clientSecret) {
          setError("Could not initialise payment. Please try again.");
          return;
        }
        setStripeClientSecret(data.clientSecret);
        setStripePaymentIntentId(data.paymentIntentId ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, selected, paymentQualifiersPassed, email]);

  useEffect(() => {
    if (gateway !== "stripe" || !paymentQualifiersPassed) {
      setStripeClientSecret(null);
      if (stage === "payment") {
        setStripePaymentIntentId(null);
      }
    }
  }, [gateway, paymentQualifiersPassed, stage]);

  // ── Send real OTP when 2FA stage begins ─────────────────────────────────────
  useEffect(() => {
    if (stage !== '2fa' || !phone) return;
    const e164 = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    supabase.functions.invoke('send-otp', { body: { phone: e164 } }).catch(console.warn);
  }, [stage]);

  const goToStage = useCallback(
    (next: ShopFlowStage, opts?: { replace?: boolean }) => {
      setStageState(next);
      navigate(shopPathForStage(next), { replace: opts?.replace ?? false });
    },
    [navigate]
  );

  /** Standalone scheduling stage was merged into medical intake; normalize in-memory state. */
  useEffect(() => {
    if (stage !== "scheduling") return;
    goToStage("questionnaire", { replace: true });
  }, [stage, goToStage]);

  /** Browser back/forward and shared URLs stay in sync with wizard stage. */
  useEffect(() => {
    const parsed = shopStageFromStepParam(stepParam);
    if (stepParam && parsed === null) {
      navigate("/patient/shop", { replace: true });
      return;
    }
    setStageState(parsed ?? "catalog");
  }, [stepParam, navigate]);

  /** Deep link to a step without a chosen program → back to catalog. */
  useEffect(() => {
    if (stage === "catalog") return;
    if (selected) return;
    if (resumeDraftAvailable) return;
    navigate("/patient/shop", { replace: true });
    setStageState("catalog");
  }, [stage, selected, resumeDraftAvailable, navigate]);

  // ── Reset Stripe secret when product changes ─────────────────────────────────
  const startFlow = (product: any) => {
    clearEnrollmentDraft();
    setResumeDraftAvailable(false);
    setSelected(product);
    setQStep(0);
    setAnswers({});
    setGateway("");
    setStripeClientSecret(null);
    setStripePaymentIntentId(null);
    setBookingAttestation(false);
    setConsultationTime("");
    setPaymentQualifiersPassed(false);
    setQualifierAge18_75(false);
    setQualifierNotPregnant(false);
    setQualifierNoMtcMen2(false);
    setQualifierUsResident(false);
    setIdentityStripeCompleted(false);
    setSchedulingRef(null);
    goToStage("payment");
  };

  const filteredProducts = activeCat === "All" ? dbProducts : dbProducts.filter(p => p.category === activeCat);
  const catalogCategories = ["All", ...Array.from(new Set(dbProducts.map(p => p.category)))];

  useEffect(() => {
    if (isLoadingProducts || dbProducts.length === 0) return;
    const d = loadEnrollmentDraft();
    if (d?.selectedProductId && dbProducts.some((p) => p.id === d.selectedProductId)) {
      setResumeDraftAvailable(true);
    } else if (d?.selectedProductId) {
      clearEnrollmentDraft();
      setResumeDraftAvailable(false);
    }
  }, [isLoadingProducts, dbProducts]);

  const applyResumeDraft = useCallback(() => {
    const d = loadEnrollmentDraft();
    if (!d?.selectedProductId) return;
    const p = dbProducts.find((x) => x.id === d.selectedProductId);
    if (!p) {
      clearEnrollmentDraft();
      setResumeDraftAvailable(false);
      return;
    }
    const allowed: ShopFlowStage[] = [
      "payment",
      "payment_confirmation",
      "account_setup",
      "2fa",
      "identity",
      "questionnaire",
      "scheduling",
    ];
    let nextStage = (allowed.includes(d.stage as ShopFlowStage) ? d.stage : "payment") as ShopFlowStage;
    const fromLegacyScheduling = nextStage === "scheduling";
    if (fromLegacyScheduling) nextStage = "questionnaire";
    setSelected(p);
    setEmail(d.email);
    setPhone(d.phone);
    setFirstName(d.firstName);
    setLastName(d.lastName);
    setPassword(d.password);
    setDob(d.dob);
    setSex(d.sex);
    setHeightFt(d.heightFt);
    setHeightIn(d.heightIn);
    setWeight(d.weight);
    setHairColor(d.hairColor);
    setEyeColor(d.eyeColor);
    setBloodType(d.bloodType);
    setAllergies(d.allergies);
    setCurrentMeds(d.currentMeds);
    setAddress(d.address);
    setCity(d.city);
    setState(d.state);
    setZip(d.zip);
    setAgreedToTerms(d.agreedToTerms);
    setOtp(d.otp);
    const questionnaireLen = p.questionnaire?.length ?? 0;
    setQStep(fromLegacyScheduling ? (questionnaireLen > 0 ? questionnaireLen - 1 : 0) : d.qStep);
    setSchedulingRef(d.scheduling_ref ?? null);
    setAnswers(d.answers || {});
    setGateway(d.gateway || "");
    setConsultationTime(d.consultationTime);
    setBookingAttestation(d.bookingAttestation);
    setPaymentQualifiersPassed(d.paymentQualifiersPassed ?? false);
    setQualifierAge18_75(d.qualifierAge18_75);
    setQualifierNotPregnant(d.qualifierNotPregnant);
    setQualifierNoMtcMen2(d.qualifierNoMtcMen2);
    setQualifierUsResident(d.qualifierUsResident);
    setIdentityStripeCompleted(d.identityStripeCompleted);
    setActiveCat(d.activeCat || "All");
    setStripeClientSecret(null);
    const restoredPi = d.stripePaymentIntentId ?? null;
    if (nextStage === "payment" && restoredPi) {
      nextStage = "payment_confirmation";
    }
    setStripePaymentIntentId(restoredPi);
    setError(null);
    goToStage(nextStage);
  }, [dbProducts, goToStage]);

  const globalVideoStates = useMemo(
    () => parseGlobalVideoStatesFromEnv(import.meta.env.VITE_VIDEO_REQUIRED_STATES),
    []
  );
  const videoRules = useMemo(
    () => (selected ? parseProductVideoRules(selected.rawFeatures) : null),
    [selected]
  );
  const clinicalContext: ClinicalContext = useMemo(() => {
    const bmi = computeNumericBmi(heightFt, heightIn, weight);
    const ageY = computeAgeYears(dob);
    const ageFallback =
      dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;
    return {
      patientState: state,
      productCategory: selected?.category ?? "",
      productId: selected?.id ?? "",
      bmi,
      age: ageY ?? ageFallback,
      answers,
    };
  }, [state, selected, heightFt, heightIn, weight, dob, answers]);

  const needsScheduledVideo = useMemo(() => {
    if (!videoRules) return false;
    return requiresSyncVideoVisit(videoRules, globalVideoStates, routingRulesFromDb, clinicalContext);
  }, [videoRules, globalVideoStates, routingRulesFromDb, clinicalContext]);

  const [schedulingRef, setSchedulingRef] = useState<string | null>(null);
  useEffect(() => {
    if (!needsScheduledVideo || !selected) return;
    setSchedulingRef((r) => r ?? `SC-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`);
  }, [needsScheduledVideo, selected]);

  const totalQ = selected?.questionnaire?.length ?? 0;
  const currentQ = totalQ > 0 ? selected?.questionnaire?.[qStep] : undefined;

  /** Reset clinician match when ship-to state or product changes (avoid stale embed). */
  useEffect(() => {
    setAssignedDoctorForScheduling(null);
  }, [state, selected?.id]);

  useEffect(() => {
    if (stage !== "questionnaire" || !needsScheduledVideo || !selected) return;
    if (totalQ > 0 && qStep !== totalQ - 1) return;
    let cancelled = false;
    (async () => {
      setSchedulingDoctorLoading(true);
      try {
        const { data: doctors, error } = await supabase
          .from("profiles")
          .select("id, full_name, calendly_url, licensed_states, patients_count")
          .eq("role", "doctor")
          .eq("status", "active")
          .order("patients_count", { ascending: true });
        if (cancelled) return;
        if (error) {
          console.error("[Shop] scheduling doctors:", error);
          setAssignedDoctorForScheduling(null);
          return;
        }
        const st = (state || "").trim().toUpperCase();
        const pool = doctors || [];
        const inState = (d: { licensed_states?: string | null }) =>
          (d.licensed_states || "")
            .split(",")
            .map((s: string) => s.trim().toUpperCase())
            .filter(Boolean)
            .includes(st);
        const withCal = (d: { calendly_url?: string | null }) =>
          typeof d.calendly_url === "string" && /^https?:\/\//i.test(d.calendly_url.trim());
        const pick =
          pool.find((d) => inState(d) && withCal(d)) ||
          pool.find((d) => inState(d)) ||
          pool.find((d) => withCal(d)) ||
          null;
        setAssignedDoctorForScheduling(pick);
      } finally {
        if (!cancelled) setSchedulingDoctorLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stage, needsScheduledVideo, selected?.id, qStep, totalQ, state]);

  const rawSchedulingBase = useMemo(() => {
    const docUrl = assignedDoctorForScheduling?.calendly_url?.trim();
    const productUrl = videoRules?.schedulingEmbedUrl;
    const envUrl = (import.meta.env.VITE_SCHEDULING_EMBED_URL as string | undefined)?.trim();
    if (docUrl && /^https?:\/\//i.test(docUrl)) return docUrl;
    if (productUrl) return productUrl;
    if (envUrl && envUrl.startsWith("https://")) return envUrl;
    return defaultCalendlyBookingPageUrl();
  }, [assignedDoctorForScheduling?.calendly_url, videoRules?.schedulingEmbedUrl]);

  const schedulingEmbedSrc = useMemo(() => {
    return (
      toSchedulingIframeSrc(rawSchedulingBase, {
        email: email || undefined,
        name: `${firstName} ${lastName}`.trim() || undefined,
        utmContent: schedulingRef ?? undefined,
        utmCampaign: "peak_enrollment",
      }) || rawSchedulingBase
    );
  }, [rawSchedulingBase, email, firstName, lastName, schedulingRef]);

  const schedulingDoctorHint = useMemo(() => {
    if (!assignedDoctorForScheduling) return null;
    const st = (state || "").trim().toUpperCase();
    const licensed = (assignedDoctorForScheduling.licensed_states || "")
      .split(",")
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean);
    if (st && licensed.includes(st)) return `Licensed in ${st}`;
    return "Clinical video pool";
  }, [assignedDoctorForScheduling, state]);

  useEffect(() => {
    if (stage === "catalog" || stage === "confirmed" || !selected) return;
    if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current);
    saveDraftTimer.current = setTimeout(() => {
      const draft: EnrollmentDraftV1 = {
        v: 1,
        savedAt: Date.now(),
        stage,
        selectedProductId: selected.id,
        email,
        phone,
        firstName,
        lastName,
        password,
        dob,
        sex,
        heightFt,
        heightIn,
        weight,
        hairColor,
        eyeColor,
        bloodType,
        allergies,
        currentMeds,
        address,
        city,
        state,
        zip,
        agreedToTerms,
        otp,
        qStep,
        answers,
        gateway,
        consultationTime,
        bookingAttestation,
        paymentQualifiersPassed,
        qualifierAge18_75,
        qualifierNotPregnant,
        qualifierNoMtcMen2,
        qualifierUsResident,
        identityStripeCompleted,
        activeCat,
        scheduling_ref: schedulingRef,
        stripePaymentIntentId,
      };
      saveEnrollmentDraft(draft);
    }, 800);
    return () => {
      if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current);
    };
  }, [
    stage,
    selected,
    email,
    phone,
    firstName,
    lastName,
    password,
    dob,
    sex,
    heightFt,
    heightIn,
    weight,
    hairColor,
    eyeColor,
    bloodType,
    allergies,
    currentMeds,
    address,
    city,
    state,
    zip,
    agreedToTerms,
    otp,
    qStep,
    answers,
    gateway,
    consultationTime,
    bookingAttestation,
    paymentQualifiersPassed,
    qualifierAge18_75,
    qualifierNotPregnant,
    qualifierNoMtcMen2,
    qualifierUsResident,
    identityStripeCompleted,
    activeCat,
    schedulingRef,
    stripePaymentIntentId,
  ]);

  const handleAnswer = (id: string, val: string) => {
    setAnswers(a => ({ ...a, [id]: val }));
  };

  const handleCompleteSetup = async () => {
    if (!selected || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    // ── Resolve identity synchronously from auth store or form state ──────────
    const existingUser = useAuthStore.getState().user;
    const meta = existingUser?.user_metadata || {};

    const resolvedFirstName = firstName || meta.first_name || 'Patient';
    const resolvedLastName  = lastName  || meta.last_name  || '';
    const resolvedEmail     = email     || existingUser?.email || '';

    const heightInches = (parseInt(heightFt || '0') * 12) + parseInt(heightIn || '0');
    const weightNum    = parseFloat(weight || '0');
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
      phone,
      email: resolvedEmail,
    };

    try {
      let userId: string | null = null;
      let sessionToSet = null;

      if (existingUser) {
        // ── Existing logged-in patient ────────────────────────────────────────
        userId = existingUser.id;
      } else {
        // ── New patient — validate and create account ─────────────────────────
        if (!resolvedEmail || !resolvedEmail.includes('@'))
          throw new Error("A valid email is required.");
        if (!password || password.length < 6)
          throw new Error("Password must be at least 6 characters.");
        if (!resolvedFirstName || resolvedFirstName === 'Patient')
          throw new Error("First and last name are required.");

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: resolvedEmail.trim().toLowerCase(),
          password,
          options: {
            data: {
              first_name: resolvedFirstName,
              last_name: resolvedLastName,
              date_of_birth: dob,
              phone,
              role: 'patient',
            }
          }
        });

        if (authError) {
          const msg = authError.message.toLowerCase();
          if (authError.status === 500 || msg.includes('unexpected') || msg.includes('server')) {
            // Server may have created the user — try signing in as fallback
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: resolvedEmail.trim().toLowerCase(),
              password,
            });
            if (!signInError && signInData.user) {
              userId = signInData.user.id;
              sessionToSet = signInData.session;
            } else {
              throw new Error("Account creation failed. Please try again in a moment.");
            }
          } else if (msg.includes('already registered') || msg.includes('already exists')) {
            throw new Error("This email is already registered. Please sign in at /patient/login.");
          } else {
            throw authError;
          }
        } else {
          userId = authData.user?.id || null;
          sessionToSet = authData.session;
        }
      }

      if (!idFile && !identityStripeCompleted)
        throw new Error("Please upload a photo of your government ID, or complete Stripe Identity verification.");

      const rules = parseProductVideoRules(selected.rawFeatures);
      const needsVideo = requiresSyncVideoVisit(rules, globalVideoStates, routingRulesFromDb, {
        patientState: state,
        productCategory: selected.category,
        productId: selected.id,
        bmi: computeNumericBmi(heightFt, heightIn, weight),
        age: computeAgeYears(dob) ?? (dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null),
        answers,
      });
      if (needsVideo && !bookingAttestation) {
        throw new Error("Please book a time in the calendar above and confirm before continuing.");
      }

      if (!userId) throw new Error("Could not determine user ID — please try again.");

      // ── Auto sign-in for new patients BEFORE order insertion (fixes RLS) ──────
      if (!existingUser) {
        if (sessionToSet) {
          await supabase.auth.setSession(sessionToSet);
        } else {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: resolvedEmail.trim().toLowerCase(),
            password
          });
          if (signInError) {
             console.error("Auto-login error:", signInError);
             // We still try to proceed, but if RLS strictly requires auth.uid(), it will fail on insert
          } else if (signInData.session) {
             await supabase.auth.setSession(signInData.session);
          }
        }
        await initialize(); // Refresh auth store so the rest of the app knows the user is logged in
      }

      // ── Generate a fresh unique order number (prevents 409 on retry) ─────────
      const freshOrderRef = "RX-" + Date.now().toString(36).toUpperCase() +
                            "-" + Math.random().toString(36).slice(2, 5).toUpperCase();

      // ── Capture Referral Code ────────────────────────────────────────────────
      const referralCode = localStorage.getItem('peak_health_referral_code');

      const orderedDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const intakeTimeline = [
        { status: "order_submitted", date: orderedDateStr },
        { status: "intake_completed", date: orderedDateStr },
      ];

      // ── Insert order into Supabase ────────────────────────────────────────────
      const assigned = !!assignedDoctorForScheduling;
      const { data: insertedRow, error: insertError } = await supabase.from('orders').insert([{
        order_number:      freshOrderRef,
        mrn:               generateMRN(),
        doctor_id:         assignedDoctorForScheduling?.id || null,
        doctor:            assignedDoctorForScheduling?.full_name || null,
        status:            assigned ? "medical_review" : "order_submitted",
        patient_name:      `${resolvedFirstName} ${resolvedLastName}`.trim() || "New Patient",
        patient_email:     resolvedEmail,
        patient_state:     (state || "").trim().toUpperCase() || null,
        patient_avatar:    (resolvedFirstName[0] || "") + (resolvedLastName[0] || ""),
        patient_age:       age,
        patient_country:   "🇺🇸 US",
        sub_brand:         "Peak Health",
        medication:        selected.name,
        dosage_instructions: selected.tagline,
        category:          selected.category,
        ordered_date:      orderedDateStr,
        amount:            selected.priceUSD,
        user_id:           userId,
        intake_complete:   true,
        intake_notes:      `H: ${patientVitals.height} | W: ${weight}lbs | BMI: ${bmi} | Sex: ${sex} | Blood: ${bloodType} | Allergies: ${allergies || 'None'} | Meds: ${currentMeds || 'None'}`,
        intake_answers:    {
          ...answers,
          ...(needsVideo
            ? { _scheduling: { external_calendar: true, acknowledged_booking: bookingAttestation } }
            : {}),
        },
        patient_vitals:    patientVitals,
        consultation_time: needsVideo ? (consultationTime || null) : null,
        zoom_status: needsVideo ? "requested" : "not_requested",
        zoom_doctor_message:   null,
        zoom_rescheduled_time: null,
        referral_code:     referralCode,
        stripe_payment_intent_id: stripePaymentIntentId || null,
        payment_status:    stripePaymentIntentId ? "paid" : "pending",
        timeline: intakeTimeline,
        scheduling_ref: needsVideo && schedulingRef ? schedulingRef : null,
        scheduling_booking_url:
          needsVideo
            ? (() => {
                const tab = toSchedulingOpenTabUrl(schedulingEmbedSrc);
                return tab && /^https?:\/\//i.test(tab) ? tab.slice(0, 4000) : null;
              })()
            : null,
      }]).select("id").maybeSingle();


      if (insertError) throw new Error(`Order submission failed: ${insertError.message}`);

      const newOrderUuid = insertedRow?.id as string | undefined;
      if (!assigned && newOrderUuid && (state || "").trim()) {
        const { error: routeErr } = await supabase.functions.invoke("assign-doctor", {
          body: { order_id: newOrderUuid, patient_state: (state || "").trim().toUpperCase() },
        });
        if (routeErr) console.warn("[Shop] assign-doctor:", routeErr.message);
      }

      if (needsVideo && schedulingRef) {
        const { error: mergeErr } = await supabase.functions.invoke("merge-scheduling-pending", {
          body: { order_number: freshOrderRef, scheduling_ref: schedulingRef },
        });
        if (mergeErr) console.warn("[Shop] merge-scheduling-pending:", mergeErr.message);
      }

      if (stripePaymentIntentId) {
        const { error: attachErr } = await supabase.functions.invoke("stripe-attach-order", {
          body: { payment_intent_id: stripePaymentIntentId, order_number: freshOrderRef },
        });
        if (attachErr) console.warn("[Shop] stripe-attach-order:", attachErr.message);
      }

      // ── Success: Clear referral code & Notify Referly ───────────────────────
      if (referralCode) {
        localStorage.removeItem('peak_health_referral_code');
      }

      // REFERLY CONVERSION SYNC
      if (window.referly) {
        window.referly('convert', {
          amount: selected.priceUSD,
          email: resolvedEmail,
          order_id: freshOrderRef
        });
      }

      // ── Refresh patient store so new order appears immediately ────────────────
      await usePatientStore.getState().fetchOrders();

      // ── Update local state for the confirmed screen ───────────────────────────
      setSubmittedOrderRef(freshOrderRef);
      setFirstName(resolvedFirstName);
      setLastName(resolvedLastName);
      setEmail(resolvedEmail);
      clearEnrollmentDraft();
      setResumeDraftAvailable(false);
      goToStage("confirmed");

    } catch (err: any) {
      console.error("[Enrollment error]", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === "confirmed" && selected) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 pt-8">
        <PatientEnrollmentStepper stage={stage} className="text-left mb-2" />
        <div className="flex justify-center mb-8">
           <PatientBrandMark size="md" />
        </div>
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800/80">
            Step 9 · {getClientFlowRowByDiagramStep(9)?.title ?? "Patient portal (dashboard)"}
          </p>
          <h2 className="text-xl font-bold mt-1">Welcome to Peak Health, {firstName}!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {getClientFlowRowByDiagramStep(9)?.subtitle ?? "Track your order and care from your dashboard."}
          </p>
        </div>
        <Card className="text-left">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Product</span><span className="font-semibold">{selected.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order Ref</span><span className="font-mono font-bold text-primary">{submittedOrderRef || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="font-semibold">{GATEWAY_DISPLAY[gateway]?.label}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Account</span><span className="font-semibold text-emerald-600">✓ {email}</span></div>
          </CardContent>
        </Card>
        <div className="bg-secondary/40 border border-secondary rounded-2xl p-4 text-sm text-secondary-foreground text-left">
          <p className="font-semibold mb-1">What happens next (step 9 dashboard)</p>
          <ol className="space-y-1 text-xs list-decimal list-inside opacity-90">
            <li>In review — a licensed clinician evaluates your step 8 intake (often within a few hours).</li>
            <li>Order approved — if cleared, your prescription is sent to the pharmacy.</li>
            <li>Order shipped — medication dispatches with tracking; refills stay in the same portal.</li>
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
        <PatientEnrollmentStepper stage={stage} />
        <div className="flex justify-center mb-4">
           <PatientBrandMark size="md" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100 mb-4">
            <CheckCircle2 className="h-3.5 w-3.5" /> Payment Successful
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800/80">
            Step 5 · {getClientFlowRowByDiagramStep(5)?.title ?? "Patient registration portal"}
          </p>
          <h1 className="text-2xl font-bold mt-1">Create your patient portal login</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {getClientFlowRowByDiagramStep(5)?.subtitle ??
              "Create your secure credentials and profile so we can continue to clinical intake."}{" "}
            Your payment is secured; next steps are identity verification and the medication-specific questionnaire (step
            8).
          </p>
          {stripePaymentIntentId && (
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-primary hover:underline"
              onClick={() => goToStage("payment_confirmation")}
            >
              View payment confirmation
            </button>
          )}
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

        {/* ID Upload Moved to Identity Stage */}

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
          onClick={() => {
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              goToStage("questionnaire");
            } else {
              goToStage("2fa");
            }
          }}>
          Continue to Phone Verification <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  if (stage === "2fa" && selected) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-8">
        <PatientEnrollmentStepper stage={stage} />
        <div className="flex justify-center mb-4">
           <PatientBrandMark size="md" />
        </div>
        <div className="text-center">
          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShieldCheck className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800/80">
            Step 6 · {getClientFlowRowByDiagramStep(6)?.title ?? "Account creation + 2FA"}
          </p>
          <h1 className="text-2xl font-bold mt-1">Account creation + 2FA</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {getClientFlowRowByDiagramStep(6)?.subtitle ?? "SMS / email authentication to protect your account."}
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            We sent a 6-digit code to
            <br />
            <span className="font-bold text-foreground">{phone || "(555) 000-0000"}</span>
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex justify-center gap-2">
            {[0,1,2,3,4,5].map((i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white shadow-sm"
                value={otp[i] || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0,1);
                  const chars = otp.split("");
                  chars[i] = val;
                  setOtp(chars.join(""));
                  if (val && i < 5) {
                    (document.getElementById(`otp-${i+1}`) as HTMLInputElement)?.focus();
                  }
                }}
              />
            ))}
          </div>
          {error && <p className="text-red-500 text-xs text-center font-semibold">{error}</p>}
          <Button
            className="w-full rounded-xl h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white"
            disabled={otp.length !== 6 || isVerifyingOtp}
            onClick={async () => {
              setIsVerifyingOtp(true);
              setError(null);
              try {
                // Format phone to E.164
                const e164 = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g,'')}`;
                const res = await supabase.functions.invoke('verify-otp', {
                  body: { phone: e164, code: otp },
                });
                if (res.error || !res.data?.verified) {
                  setError(res.data?.error || 'Invalid code. Please try again.');
                } else {
                  goToStage('identity');
                }
              } catch (e: any) {
                setError(e.message);
              } finally {
                setIsVerifyingOtp(false);
              }
            }}
          >
            {isVerifyingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Didn't receive the code?{" "}
            <button
              className="font-bold text-primary hover:underline"
              onClick={async () => {
                const e164 = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g,'')}`;
                await supabase.functions.invoke('send-otp', { body: { phone: e164 } });
              }}
            >
              Resend SMS
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (stage === "identity" && selected) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-8">
        <PatientEnrollmentStepper stage={stage} />
        <div className="flex justify-center mb-4">
           <PatientBrandMark size="md" />
        </div>

        <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <ShieldCheck className="h-32 w-32" />
           </div>

           <div className="flex items-center gap-2 mb-2">
             <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 text-[10px] font-black uppercase">
               Powered by Stripe Identity™
             </Badge>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800/80">
             Step 7 · {getClientFlowRowByDiagramStep(7)?.title ?? "Identity verification (3rd party)"}
           </p>
           <h1 className="text-2xl font-bold mt-2">Identity verification (3rd party)</h1>
           <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
             {getClientFlowRowByDiagramStep(7)?.subtitle ??
               "Government ID verification for KYC — typically under one minute."}{" "}
             To comply with KYC and telemedicine regulations, we use a government-issued ID. This usually takes less than
             60 seconds.
           </p>

           {error && (
             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
               {error}
             </div>
           )}

           <div className="space-y-4 mt-8 relative z-10">
              <Button
                className="w-full rounded-2xl h-14 text-base font-bold bg-[#0A0D14] hover:bg-gray-800 text-white shadow-xl shadow-gray-900/10"
                disabled={isVerifyingIdentity}
                onClick={async () => {
                  setIsVerifyingIdentity(true);
                  setError(null);
                  try {
                    // Call our Edge Function to create a Stripe Identity session
                    const { data, error: fnErr } = await supabase.functions.invoke('verify-identity', {
                      body: {
                        userId: useAuthStore.getState().user?.id ?? null,
                        orderId: null, // order not created yet at this stage
                      },
                    });
                    if (fnErr || !data?.clientSecret) {
                      throw new Error(fnErr?.message || 'Could not start identity verification.');
                    }
                    // Load Stripe Identity SDK dynamically
                    const stripe = await stripePromise;
                    if (!stripe) throw new Error('Stripe failed to load.');
                    const result = await (stripe as any).verifyIdentity(data.clientSecret);
                    if (result.error) {
                      setError(result.error.message || 'Verification failed.');
                    } else {
                      setIdentityStripeCompleted(true);
                      goToStage("questionnaire");
                    }
                  } catch (e: any) {
                    setError(e.message);
                  } finally {
                    setIsVerifyingIdentity(false);
                  }
                }}
              >
                {isVerifyingIdentity ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-400" /> Launching Verification...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><Shield className="h-5 w-5" /> Verify My Identity</span>
                )}
              </Button>

              <button
                className="w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                onClick={() => goToStage('questionnaire')}
              >
                Skip for now (verification required before prescription is issued)
              </button>
           </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
           <Shield className="h-3.5 w-3.5 text-emerald-500" /> End-to-end encrypted · HIPAA compliant · Powered by Stripe
        </p>
      </div>
    );
  }

  if (stage === "payment" && selected) {
    const weightLoss = selected.category === "Weight Loss";
    const displayedGateways = effectiveProductGateways(selected.gateways, {
      requireStripeOnly,
    });

    const qualifierErr = (): string | null => {
      if (!firstName?.trim() || !lastName?.trim()) return "Enter your first and last name.";
      if (!email?.includes("@")) return "Enter a valid email address.";
      const st = (state || "").trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(st)) return "Enter a valid two-letter US ship-to state.";
      if (!qualifierUsResident) return "Please confirm US treatment eligibility.";
      if (!qualifierAge18_75) return "Please confirm you are between 18 and 75 years of age.";
      if (weightLoss) {
        if (!qualifierNotPregnant) return "Please confirm pregnancy and breastfeeding attestation.";
        if (!qualifierNoMtcMen2) return "Please confirm MTC / MEN 2 history attestation.";
      }
      return null;
    };

    const formattedCard = cardNum.replace(/(.{4})/g, "$1 ").trim();
    const cardReady =
      gateway === "stripe"
        ? cardNum.length === 16 && cardExpiry.length === 5 && cardCvc.length === 3
        : !!gateway;

    if (!paymentQualifiersPassed) {
      return (
        <div className="max-w-md mx-auto space-y-5 pb-8">
          <PatientShopTopChrome
            stage={stage}
            brandSize="md"
            onBack={() => goToStage("catalog")}
            backLabel="Back to catalog"
            badgeLabel="Step 3 · Checkout page"
          />
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.category}</p>
              </div>
              <span className="font-extrabold text-primary text-lg">{selected.price}</span>
            </CardContent>
          </Card>

          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Step 3 · Health qualifier & shipping (before payment)
          </p>
          <p className="text-sm text-muted-foreground">
            {getClientFlowRowByDiagramStep(3)?.subtitle ??
              "Basic info, shipping, health qualifier, and conditional eligibility."}{" "}
            You will enter payment on the next screen.
          </p>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary"
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary"
            />
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                US ship-to state (2 letters)
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="e.g. TX"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 uppercase focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary shrink-0"
                checked={qualifierUsResident}
                onChange={(e) => setQualifierUsResident(e.target.checked)}
              />
              <span className="text-xs leading-relaxed text-foreground">
                I am a US resident and understand medication ships to valid US addresses only.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary shrink-0"
                checked={qualifierAge18_75}
                onChange={(e) => setQualifierAge18_75(e.target.checked)}
              />
              <span className="text-xs leading-relaxed text-foreground">
                I confirm I am between 18 and 75 years of age.
              </span>
            </label>
            {weightLoss && (
              <>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary shrink-0"
                    checked={qualifierNotPregnant}
                    onChange={(e) => setQualifierNotPregnant(e.target.checked)}
                  />
                  <span className="text-xs leading-relaxed text-foreground">
                    I am not pregnant, not breastfeeding, and not trying to conceive.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary shrink-0"
                    checked={qualifierNoMtcMen2}
                    onChange={(e) => setQualifierNoMtcMen2(e.target.checked)}
                  />
                  <span className="text-xs leading-relaxed text-foreground">
                    I do not have a personal or family history of medullary thyroid carcinoma (MTC) or multiple
                    endocrine neoplasia type 2 (MEN 2).
                  </span>
                </label>
              </>
            )}
          </div>

          {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}

          <Button
            className="w-full rounded-xl h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              const qe = qualifierErr();
              if (qe) {
                setError(qe);
                return;
              }
              setError(null);
              setPaymentQualifiersPassed(true);
            }}
          >
            Continue to secure payment <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      );
    }

    if (displayedGateways.length === 0) {
      return (
        <div className="max-w-md mx-auto space-y-4 p-6 text-center">
          <PatientEnrollmentStepper stage={stage} />
          <p className="text-sm text-muted-foreground">
            Card checkout is not configured for this product. Please contact support.
          </p>
          <Button variant="outline" onClick={() => goToStage("catalog")}>
            Back to catalog
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto space-y-5 pb-10">
        <PatientShopTopChrome
          stage={stage}
          brandSize="md"
          onBack={() => goToStage("catalog")}
          backLabel="Back to catalog"
          badgeLabel="Step 3 · Checkout page"
        />

        <button
          type="button"
          className="text-xs font-semibold text-primary hover:underline"
          onClick={() => {
            setPaymentQualifiersPassed(false);
            setGateway("");
            setStripeClientSecret(null);
            setStripePaymentIntentId(null);
            setError(null);
          }}
        >
          ← Edit step 3 (eligibility & contact)
        </button>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {selected.category} · Ship to {state.toUpperCase()}
              </p>
            </div>
            <span className="font-extrabold text-primary text-lg">{selected.price}</span>
          </CardContent>
        </Card>

        <motion.div layout className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Checkout page</p>
              <p className="text-base font-bold text-foreground tracking-tight">Choose how you pay</p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700/70">PCI-aware</span>
          </div>
          {!hasStripePublishableKey && (
            <p className="rounded-xl border border-emerald-100/90 bg-emerald-50/50 px-3 py-2 text-[11px] leading-relaxed text-emerald-950/85">
              <span className="font-semibold">Preview mode.</span> Card and wallet options use a local demo until{" "}
              <code className="rounded bg-white/80 px-1 font-mono text-[10px]">VITE_STRIPE_PUBLISHABLE_KEY</code> is
              set—nothing is charged.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedGateways.map((gw: string, i: number) => {
              const meta = GATEWAY_DISPLAY[gw];
              const selected = gateway === gw;
              const darkTile = gw === "apple_pay";
              return (
                <motion.button
                  key={gw}
                  type="button"
                  layout
                  onClick={() => setGateway(gw)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.06, 0.24), duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "relative flex flex-col gap-0.5 rounded-2xl border-2 p-4 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2",
                    meta?.tileClass ?? "border-slate-200 bg-white",
                    selected
                      ? cn("shadow-lg shadow-slate-900/10 scale-[1.02]", meta?.selectedRing ?? "ring-2 ring-primary/35 ring-offset-2 ring-offset-white")
                      : "hover:shadow-md hover:-translate-y-0.5 border-transparent hover:border-slate-200/90",
                    darkTile && "text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner",
                        darkTile
                          ? "border-white/15 bg-white/10 backdrop-blur-md"
                          : "border-black/[0.04] bg-white/90",
                      )}
                    >
                      {gatewayTileIcon(gw)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-bold text-sm leading-tight", darkTile ? "text-white" : "text-slate-900")}>
                        {meta?.label ?? gw}
                      </p>
                      <p
                        className={cn(
                          "text-[11px] mt-0.5 leading-snug",
                          darkTile ? "text-zinc-300" : "text-muted-foreground",
                        )}
                      >
                        {meta?.tagline ?? "Secure payment"}
                      </p>
                    </div>
                    {selected ? (
                      <CheckCircle2
                        className={cn("h-6 w-6 shrink-0", darkTile ? "text-emerald-400" : "text-emerald-600")}
                        aria-hidden
                      />
                    ) : (
                      <div
                        className={cn("h-5 w-5 shrink-0 rounded-full border-2", darkTile ? "border-zinc-500" : "border-slate-200")}
                        aria-hidden
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {requireStripeOnly && (
          <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-xl px-3 py-2 leading-relaxed">
            Wallet buttons are hidden because{" "}
            <code className="font-mono text-[10px]">VITE_CHECKOUT_STRIPE_ONLY=true</code>. Remove it to show the full
            picker.
          </p>
        )}

        {gateway && gateway !== "stripe" && !simulateNonStripeWallets && (
          <AltGatewayReadinessPanel
            gatewayId={gateway}
            displayName={GATEWAY_DISPLAY[gateway]?.label ?? gateway}
            priceText={selected.price}
            onChooseCard={() => {
              setGateway("stripe");
              setError(null);
            }}
          />
        )}

        {showLocalCardDemo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {GATEWAY_DISPLAY[gateway]?.label ?? gateway} · demo
              </p>
              <span className="text-[10px] font-bold text-amber-700/90 uppercase tracking-wide">Not charged</span>
            </div>
            <div className="relative h-36 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-5 mb-4 overflow-hidden shadow-xl">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_60%)]" />
              <div className="flex justify-between items-start">
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Demo</span>
                <CreditCard className="h-6 w-6 text-white/50" />
              </div>
              <p className="text-white font-mono text-lg tracking-[0.2em] mt-3 font-bold">
                {cardNum
                  ? formattedCard.padEnd(19, "·").replace(/·/g, " ·").replace(/ ·/g, "·")
                  : "•••• •••• •••• ••••"}
              </p>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-white/40 text-[8px] uppercase tracking-wide">Cardholder</p>
                  <p className="text-white text-base font-bold">
                    {firstName && lastName ? `${firstName.toUpperCase()} ${lastName.toUpperCase()}` : "YOUR NAME"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[8px] uppercase tracking-wide">Expires</p>
                  <p className="text-white text-sm font-bold font-mono">{cardExpiry || "MM/YY"}</p>
                </div>
              </div>
            </div>

            <Card className="border-border">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Card number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formattedCard}
                      onChange={(e) => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary bg-white text-gray-900 tracking-widest"
                    />
                    {cardNum.length === 16 && (
                      <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Expiry
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                        setCardExpiry(v);
                      }}
                      placeholder="MM / YY"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">CVC</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="3 digits"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full mt-4 rounded-xl h-12 font-bold bg-slate-700 hover:bg-slate-800 text-white"
              disabled={!cardReady}
              onClick={() => {
                setStripePaymentIntentId(null);
                setError(null);
                goToStage("payment_confirmation");
              }}
            >
              Continue (demo checkout — no charge)
            </Button>
          </motion.div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pb-1">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          256-bit SSL encryption · HIPAA compliant
        </div>

        {gateway === "stripe" && stripePromise && stripeClientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: stripeClientSecret,
              appearance: {
                theme: "stripe",
                variables: { colorPrimary: "#059669" },
              },
            }}
          >
            <StripePaymentForm
              priceUSD={selected.priceUSD}
              firstName={firstName}
              lastName={lastName}
              email={email}
              productName={selected.name}
              onSuccess={(paymentIntentId) => {
                setStripePaymentIntentId(paymentIntentId);
                setError(null);
                goToStage("payment_confirmation");
              }}
              onError={(msg) => setError(msg)}
            />
          </Elements>
        ) : gateway === "stripe" && stripePromise ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground">Initialising secure payment...</p>
          </div>
        ) : !gateway ? (
          <p className="text-xs text-center text-muted-foreground">Select a payment method above.</p>
        ) : null}

        {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}
      </div>
    );
  }

  if (stage === "payment_confirmation" && selected) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-6 pb-12 text-center">
        <PatientEnrollmentStepper stage={stage} className="text-left" />
        <div className="flex justify-center mb-2">
          <PatientBrandMark size="md" />
        </div>
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800/80">
            Step 4 · {getClientFlowRowByDiagramStep(4)?.title ?? "Confirmation page"}
          </p>
          <h1 className="text-2xl font-bold mt-1">Confirmation page</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {getClientFlowRowByDiagramStep(4)?.subtitle ?? "Order submitted — next: secure patient registration."}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Thank you{firstName ? `, ${firstName}` : ""}. Your payment for{" "}
            <span className="font-semibold text-foreground">{selected.name}</span> was processed
            {stripePaymentIntentId ? " securely" : " (demo mode)"}.
          </p>
        </div>
        <Card className="text-left">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">{selected.price}</span>
            </div>
            {gateway && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold">{GATEWAY_DISPLAY[gateway]?.label ?? gateway}</span>
              </div>
            )}
            {stripePaymentIntentId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs truncate max-w-[55%]" title={stripePaymentIntentId}>
                  {stripePaymentIntentId.length > 20
                    ? `${stripePaymentIntentId.slice(0, 14)}…`
                    : stripePaymentIntentId}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Button
          className="w-full rounded-xl h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              setFirstName(currentUser.user_metadata?.first_name || firstName);
              setLastName(currentUser.user_metadata?.last_name || lastName);
              setEmail(currentUser.email || email);
              goToStage("questionnaire");
            } else {
              goToStage("account_setup");
            }
          }}
        >
          Continue <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }


  if (stage === "questionnaire" && selected && (totalQ === 0 || currentQ)) {
    const onLastIntakeStep = totalQ === 0 || qStep === totalQ - 1;
    const showScheduler = needsScheduledVideo && onLastIntakeStep;

    return (
      <div className="min-h-[100dvh] w-full bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-28">
        <PatientEnrollmentStepper stage={stage} />
        <div className="flex justify-center mb-6">
           <PatientBrandMark size="md" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800/80">
          Step 8 · {getClientFlowRowByDiagramStep(8)?.title ?? "Intake form (questionnaire)"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (totalQ > 0 && qStep > 0) setQStep((q) => q - 1);
            else goToStage("identity");
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <div className="flex items-center justify-between mb-2 gap-3">
            <h1 className="text-lg font-bold">{selected.name}</h1>
            {totalQ > 0 ? (
              <span className="text-xs text-muted-foreground shrink-0">{qStep + 1} / {totalQ}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Intake</span>
            )}
          </div>
          {totalQ > 0 && (
            <div className="flex gap-1">
              {selected.questionnaire.map((_, i) => (
                <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= qStep ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
          )}
        </div>
        {currentQ && (
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
            {onLastIntakeStep && (
              <EnrollmentIdUploadPanel
                idAccept={ID_ACCEPT}
                idFile={idFile}
                setIdFile={setIdFile}
                identityStripeCompleted={identityStripeCompleted}
                setError={setError}
                idUploadInputRef={idUploadInputRef}
                onOpenStripeIdentity={() => goToStage("identity")}
                embedded
              />
            )}
          </CardContent>
        </Card>
        )}
        {totalQ === 0 && !currentQ && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">No additional clinical questions for this program. Continue below.</p>
            </CardContent>
          </Card>
        )}
        {onLastIntakeStep && totalQ === 0 && (
          <Card className="border-2 border-emerald-200/80 shadow-lg shadow-emerald-900/5">
            <CardContent className="p-6 space-y-2">
              <EnrollmentIdUploadPanel
                idAccept={ID_ACCEPT}
                idFile={idFile}
                setIdFile={setIdFile}
                identityStripeCompleted={identityStripeCompleted}
                setError={setError}
                idUploadInputRef={idUploadInputRef}
                onOpenStripeIdentity={() => goToStage("identity")}
              />
            </CardContent>
          </Card>
        )}
        {showScheduler && (
          <>
            <PatientSchedulingPanel
              embedSrc={schedulingEmbedSrc}
              rawBookingUrl={rawSchedulingBase}
              doctorName={assignedDoctorForScheduling?.full_name ?? null}
              doctorHint={schedulingDoctorHint}
              doctorMatchPending={schedulingDoctorLoading}
              schedulingRefTail={
                schedulingRef && schedulingRef.length > 8 ? schedulingRef.slice(-10) : schedulingRef ?? null
              }
              onCalendlyBookingConfirmed={() => setBookingAttestation(true)}
            />
            <label className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/80 cursor-pointer dark:border-amber-900/50 dark:bg-amber-950/30">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary shrink-0"
                checked={bookingAttestation}
                onChange={(e) => setBookingAttestation(e.target.checked)}
              />
              <span className="text-sm text-amber-950 dark:text-amber-100">
                I booked a time using the calendar above (or opened it in my browser), as part of{" "}
                <strong className="font-semibold">step 8 — intake</strong>. I understand my video link (Zoom or Google
                Meet) will come from the scheduler by email or text. With Calendly, this box may check automatically when
                your booking completes.
              </span>
            </label>
          </>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-800 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
            <span className="mr-1.5 inline-block" aria-hidden>⚠️</span>
            {error}
          </div>
        )}
        <Button
          className="w-full rounded-xl h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          disabled={isSubmitting}
          onClick={() => {
            if (totalQ > 0 && qStep < totalQ - 1) {
              setQStep((s) => s + 1);
              return;
            }
            void handleCompleteSetup();
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Submitting your enrollment...
            </>
          ) : (
            <>
              {totalQ > 0 && qStep < totalQ - 1 ? "Continue" : "Submit enrollment"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/45 via-white to-emerald-50/15"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
    <div className="mx-auto max-w-4xl space-y-6 pb-24 px-4 sm:px-6">
      <PatientShopTopChrome
        stage={stage}
        brandSize="sm"
        onBack={() => navigate("/patient")}
        backLabel="Back to portal"
      />

      {/* Yucca-style hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8" style={{ background: "var(--brand-hero)" }}>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-900/85">
            Step 2 · {getClientFlowRowByDiagramStep(2)?.title ?? "Product page (GLP-1)"}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-lavender-900)] mt-2">
            Treatment Programs
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1 text-foreground">
            Care that actually works.<br />
            <span className="text-[var(--brand-lavender-700)]">Shipped to your door.</span>
          </h1>
          <p className="text-sm text-foreground/70 mt-2 max-w-md">
            Doctor-reviewed within hours · Custom-compounded by licensed pharmacies · 100% online from intake to refill.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-white/70 text-[var(--brand-lavender-900)]">🇺🇸 USA Only</span>
            <span className="px-2.5 py-1 rounded-full bg-white/70 text-[var(--brand-lavender-900)]">HIPAA Compliant</span>
          </div>
        </div>
      </div>

      {resumeDraftAvailable && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm">
              <p className="font-bold text-foreground">Resume your enrollment?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We saved your progress locally (up to 7 days). Continue where you left off.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  clearEnrollmentDraft();
                  setResumeDraftAvailable(false);
                }}
              >
                Discard
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  applyResumeDraft();
                  setResumeDraftAvailable(false);
                }}
              >
                Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {catalogCategories.map(cat => (
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
        {filteredProducts.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.045, 0.35), duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
          <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden border-border"
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
          </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No products in this category yet.
        </div>
      )}
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
    </motion.div>
  );
}
