import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  ChevronRight, CheckCircle2, CreditCard,
  Star, Shield, ShieldCheck, Clock, Package, ArrowLeft, Globe, Zap, Loader2,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { invokeEdgeFunction } from "../../../../lib/invokeEdgeFunction";
import { useBrand } from "../../../context/BrandContext";
import { useAuthStore } from "../../../../lib";
import { 
  usePatientStore, 
  generateMRN 
} from "../../../../lib/patient-store";
import {
  parseProductVideoRules,
  parseGlobalVideoStatesFromEnv,
  defaultSchedulingEmbedUrl,
  computeNumericBmi,
  computeAgeYears,
  type ConsultRoutingRuleRow,
  type ClinicalContext,
} from "../../../../lib/videoConsultRules";
import {
  evaluateIntakeConditionalEffects,
  getVisibleIntakeQuestions,
  normalizeIntakeQuestions,
} from "../../../../lib/intakeConditionalLogic";
import { IntakeRoutingBanner } from "../../../components/patient/IntakeRoutingBanner";
import { PatientSchedulingPanel } from "../../../components/patient/PatientSchedulingPanel";
import { resolveProductIntakeFeatures } from "../../../../lib/clinicalIntakeTemplates";
import { DEFAULT_CALENDLY_BOOKING_URL, toSchedulingIframeSrc } from "../../../../lib/calendlyEmbed";
import { pickEligibleSchedulingDoctor } from "../../../../lib/schedulingDoctorMatch";
import {
  ENROLLMENT_DRAFT_KEY,
  DRAFT_MAX_AGE_MS,
  loadEnrollmentDraft,
  saveEnrollmentDraft,
  clearEnrollmentDraft,
  type EnrollmentDraftV1,
} from "../../../../lib/enrollmentDraft";
import {
  buildEnrollmentPatientVitals,
  formatIntakeNotesLine,
  syncEnrollmentVitalsToReadings,
} from "../../../../lib/patientVitals";
import { toCustomerMessage } from "../../../../lib/customerSafeError";
import { insertPatientOrder } from "../../../../lib/insertPatientOrder";
import {
  shopPathForStage,
  shopStageFromStepParam,
  type ShopFlowStage,
} from "../../../../lib/patientShopRoutes";
import { PatientEnrollmentCatalogChrome } from "../../../components/patient/PatientEnrollmentCatalogChrome";
import { PatientShopTopChrome } from "../../../components/patient/PatientShopTopChrome";
import { EnrollmentFlowShell } from "../../../components/patient/EnrollmentFlowShell";
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
        onError(toCustomerMessage(result.error, "payment"));
      } else if (result.paymentIntent?.status === "succeeded") {
        onSuccess(result.paymentIntent.id);
      } else {
        onError("Payment incomplete. Please try again.");
      }
    } catch (e: unknown) {
      onError(toCustomerMessage(e, "payment"));
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

/** Drop legacy cosmetic fields from DB-driven intake (often mis-tagged as "questionnaire"). */
function withoutCosmeticAppearanceQuestions(rows: unknown): unknown[] {
  if (!Array.isArray(rows)) return [];
  const labelDrop = new Set(["hair color", "eye color", "blood type"]);
  const idDrop = new Set([
    "hair_color", "haircolor", "eye_color", "eyecolor", "blood_type", "bloodtype",
  ]);
  return rows.filter((q) => {
    if (!q || typeof q !== "object") return true;
    const o = q as { id?: string; label?: string };
    const id = String(o.id ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "_");
    const idPacked = id.replace(/_/g, "");
    const label = String(o.label ?? "")
      .trim()
      .toLowerCase();
    if (labelDrop.has(label)) return false;
    if (idDrop.has(id) || idDrop.has(idPacked)) return false;
    return true;
  });
}

const gatewayConfig: Record<string, { label: string; icon: string; color: string }> = {
  stripe: { label: "Credit / Debit Card", icon: "💳", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  paypal: { label: "PayPal", icon: "🅿️", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/30" },
  apple_pay: { label: "Apple Pay", icon: "🍎", color: "border-gray-400 bg-gray-50 dark:bg-gray-950/30" },
  google_pay: { label: "Google Pay", icon: "🔵", color: "border-green-400 bg-green-50 dark:bg-green-950/30" },
  klarna: { label: "Klarna · Pay in 4", icon: "🛍️", color: "border-pink-300 bg-pink-50 dark:bg-pink-950/30" },
};

export function PatientShopPage() {
  const navigate = useNavigate();
  const { step: stepParam } = useParams();
  const [searchParams] = useSearchParams();

  const readInitialStage = (): ShopFlowStage => {
    if (typeof window === "undefined") return "catalog";
    const seg = window.location.pathname.replace(/^\/patient\/shop\/?/, "").split("/")[0];
    return shopStageFromStepParam(seg || undefined) ?? "catalog";
  };

  const [stage, setStageState] = useState<ShopFlowStage>(readInitialStage);
  const { initialize } = useAuthStore();
  const { brand, orderBrandKey } = useBrand();
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [assignedDoctorForScheduling, setAssignedDoctorForScheduling] = useState<any>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('active', true);
        if (error) throw error;
        const mapped = data.map((p) => {
          const { questionnaire, rawFeatures } = resolveProductIntakeFeatures(
            p.features,
            p.category || ""
          );
          return {
            id: p.id,
            name: p.name,
            category: p.category,
            tagline: p.tagline,
            price: `$${p.price_usd}/mo`,
            priceUSD: p.price_usd,
            rating: (rawFeatures.rating as number) || p.features?.rating || 4.9,
            reviews: (rawFeatures.reviews as number) || p.features?.reviews || 1000,
            badge: (rawFeatures.badge as string) || p.features?.badge || null,
            image: p.image_url,
            description: p.description,
            questionnaire: withoutCosmeticAppearanceQuestions(questionnaire) as any[],
            gateways: (rawFeatures.gateways as string[]) || p.features?.gateways || ["stripe", "paypal", "apple_pay", "klarna"],
            rawFeatures,
          };
        });
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

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl && stage === "catalog") {
      setActiveCat(categoryFromUrl);
    }
  }, [searchParams, stage]);
  
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
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [tempF, setTempF] = useState("");
  const [glucose, setGlucose] = useState("");
  const [respRate, setRespRate] = useState("");
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

  const requireStripeOnly =
    import.meta.env.PROD && !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const allowSimulatedAltGateway =
    !requireStripeOnly && (!stripeKey || import.meta.env.DEV);

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
        const { data, error } = await invokeEdgeFunction("create-payment-intent", {
          requireSession: false,
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
      } catch (e: unknown) {
        if (!cancelled) setError(toCustomerMessage(e, "payment"));
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
    invokeEdgeFunction("send-otp", { requireSession: false, body: { phone: e164 } }).catch(console.warn);
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
    setBpSys(d.bpSys || "");
    setBpDia(d.bpDia || "");
    setRestingHr(d.restingHr || "");
    setSpo2(d.spo2 || "");
    setTempF(d.tempF || "");
    setGlucose(d.glucose || "");
    setRespRate(d.respRate || "");
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

  const intakeQuestions = useMemo(
    () => normalizeIntakeQuestions(selected?.questionnaire ?? []),
    [selected?.questionnaire]
  );

  const visibleQuestions = useMemo(
    () => getVisibleIntakeQuestions(intakeQuestions, answers),
    [intakeQuestions, answers]
  );

  const intakeEffects = useMemo(() => {
    if (!videoRules || !selected) return null;
    return evaluateIntakeConditionalEffects(
      videoRules,
      globalVideoStates,
      routingRulesFromDb,
      clinicalContext,
      intakeQuestions
    );
  }, [
    videoRules,
    selected,
    globalVideoStates,
    routingRulesFromDb,
    clinicalContext,
    intakeQuestions,
  ]);

  const needsScheduledVideo = intakeEffects?.requiresSyncVideo ?? false;
  const intakeRouting = intakeEffects?.routing ?? null;

  const [schedulingRef, setSchedulingRef] = useState<string | null>(null);
  useEffect(() => {
    if (!needsScheduledVideo || !selected) return;
    setSchedulingRef((r) => r ?? `SC-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`);
  }, [needsScheduledVideo, selected]);

  const totalQ = visibleQuestions.length;
  const currentQ = totalQ > 0 ? visibleQuestions[qStep] : undefined;

  useEffect(() => {
    if (qStep >= totalQ && totalQ > 0) setQStep(totalQ - 1);
    else if (totalQ === 0 && qStep !== 0) setQStep(0);
  }, [totalQ, qStep]);

  // Step 7/10: Resolve Dynamic Doctor Link for Embed
  useEffect(() => {
    if (!needsScheduledVideo) setAssignedDoctorForScheduling(null);
  }, [needsScheduledVideo, state]);

  const fetchEligibleDoctor = async () => {
    try {
      const { data: doctors, error } = await supabase
        .from("profiles")
        .select("id, full_name, calendly_url, licensed_states, patients_count")
        .eq("role", "doctor")
        .eq("status", "active");

      if (error) throw error;
      const picked = pickEligibleSchedulingDoctor(doctors || [], state);
      if (picked) setAssignedDoctorForScheduling(picked);
    } catch (err) {
      console.error("Error fetching doctor for scheduling:", err);
    }
  };

  useEffect(() => {
    if (stage !== "questionnaire" || !needsScheduledVideo || !selected) return;
    if (totalQ > 0 && qStep !== totalQ - 1) return;
    if (!assignedDoctorForScheduling) void fetchEligibleDoctor();
  }, [stage, needsScheduledVideo, selected, qStep, totalQ, state, assignedDoctorForScheduling]);

  const schedulingEmbedSrc = useMemo(() => {
    const raw =
      assignedDoctorForScheduling?.calendly_url ||
      videoRules?.schedulingEmbedUrl ||
      defaultSchedulingEmbedUrl();
    return (
      toSchedulingIframeSrc(raw, {
        email: email || undefined,
        name: `${firstName} ${lastName}`.trim() || undefined,
        utmContent: schedulingRef ?? undefined,
        utmCampaign: "peak_enrollment",
      }) || raw
    );
  }, [assignedDoctorForScheduling, videoRules, email, firstName, lastName, schedulingRef]);

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
        bpSys,
        bpDia,
        restingHr,
        spo2,
        tempF,
        glucose,
        respRate,
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
    bpSys,
    bpDia,
    restingHr,
    spo2,
    tempF,
    glucose,
    respRate,
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
    setAnswers((a) => ({ ...a, [id]: val }));
  };

  const handleCheckboxAnswer = (id: string, option: string, checked: boolean) => {
    setAnswers((a) => {
      const prev = a[id];
      const list = Array.isArray(prev) ? [...prev.map(String)] : prev ? [String(prev)] : [];
      const next = checked
        ? list.includes(option)
          ? list
          : [...list, option]
        : list.filter((x) => x !== option);
      return { ...a, [id]: next };
    });
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

    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 30;
    const patientVitals = buildEnrollmentPatientVitals({
      heightFt,
      heightIn,
      weight,
      dob,
      sex,
      allergies,
      currentMeds,
      address: `${address}, ${city}, ${state} ${zip}`,
      phone,
      email: resolvedEmail,
      bpSys,
      bpDia,
      restingHr,
      spo2,
      tempF,
      glucose,
      respRate,
    });

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
              brand_id: orderBrandKey,
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

      // Identity verification is required before clinical prescription dispatch, but does not block order submission.
      if (!idFile && !identityStripeCompleted) {
        console.log("[Enrollment] Government ID not yet verified — allowed per skip-for-now policy.");
      }

      const rules = parseProductVideoRules(selected.rawFeatures);
      const submitCtx: ClinicalContext = {
        patientState: state,
        productCategory: selected.category,
        productId: selected.id,
        bmi: computeNumericBmi(heightFt, heightIn, weight),
        age: computeAgeYears(dob) ?? (dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null),
        answers,
      };
      const submitEffects = evaluateIntakeConditionalEffects(
        rules,
        globalVideoStates,
        routingRulesFromDb,
        submitCtx,
        normalizeIntakeQuestions(selected.questionnaire ?? [])
      );
      if (submitEffects.blockSubmit) {
        throw new Error(
          submitEffects.blockSubmitMessage ||
            "Based on your intake answers, we cannot complete enrollment online."
        );
      }
      const visibleAtSubmit = getVisibleIntakeQuestions(
        normalizeIntakeQuestions(selected.questionnaire ?? []),
        answers
      );
      for (const q of visibleAtSubmit) {
        if (!q.required) continue;
        const raw = answers[q.id];
        const empty =
          raw == null ||
          raw === "" ||
          (Array.isArray(raw) && raw.length === 0);
        if (empty) {
          throw new Error(`Please answer: ${q.label || "required question"}`);
        }
      }
      const needsVideo = submitEffects.requiresSyncVideo;
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

      // ── Insert order into Supabase ────────────────────────────────────────────
      const assigned = !!assignedDoctorForScheduling;
      const orderPayload: Record<string, unknown> = {
        order_number:      freshOrderRef,
        mrn:               generateMRN(),
        doctor_id:         assignedDoctorForScheduling?.id || null,
        doctor:            assignedDoctorForScheduling?.full_name || null,
        status:            assigned ? "medical_review" : "order_submitted",
        patient_name:      `${resolvedFirstName} ${resolvedLastName}`.trim() || "New Patient",
        patient_email:     resolvedEmail,
        shipping_state:          (state || "").trim().toUpperCase() || null,
        shipping_address_line1:  (address || "").trim() || null,
        shipping_city:           (city || "").trim() || null,
        shipping_zip:            (zip || "").trim() || null,
        patient_phone:           (phone || "").trim() || null,
        patient_avatar:    (resolvedFirstName[0] || "") + (resolvedLastName[0] || ""),
        patient_age:       age,
        patient_country:   "🇺🇸 US",
        sub_brand:         orderBrandKey,
        brand_id:          orderBrandKey,
        medication:        selected.name,
        dosage_instructions: selected.tagline,
        category:          selected.category,
        ordered_date:      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount:            selected.priceUSD,
        user_id:           userId,
        intake_complete:   true,
        intake_notes:      formatIntakeNotesLine(patientVitals),
        intake_answers:    {
          ...answers,
          _shipping: {
            state: (state || "").trim().toUpperCase() || null,
            address_line1: (address || "").trim() || null,
            city: (city || "").trim() || null,
            zip: (zip || "").trim() || null,
          },
          _intake_conditional: {
            requires_video: needsVideo,
            routing_reasons: submitEffects.routing.reasons,
            flag_manual_review: submitEffects.flagManualReview,
            warnings: submitEffects.warnings,
            matched_triggers: submitEffects.matchedAnswerTriggers.map((t) => t.questionId),
            scheduling_doctor_id: assignedDoctorForScheduling?.id ?? null,
          },
          ...(needsVideo
            ? { _scheduling: { external_calendar: true, acknowledged_booking: bookingAttestation } }
            : {}),
        },
        ...(submitEffects.flagManualReview ? { urgent: true } : {}),
        patient_vitals:    patientVitals,
        consultation_time: needsVideo ? (consultationTime || null) : null,
        enrollment_video_required: needsVideo,
        requires_sync_video: needsVideo,
        video_routing_reasons: submitEffects.routing.reasons,
        zoom_status: needsVideo ? "requested" : "not_requested",
        zoom_doctor_message:   null,
        zoom_rescheduled_time: null,
        referral_code:     referralCode,
        stripe_payment_intent_id: stripePaymentIntentId || null,
        payment_status:    stripePaymentIntentId ? "paid" : "pending",
        timeline: [{ status: "order_submitted", date: new Date().toLocaleDateString() }],
        scheduling_ref: needsVideo && schedulingRef ? schedulingRef : null,
      };

      const { error: insertError } = await insertPatientOrder(supabase, orderPayload);
      if (insertError) {
        console.error("[Shop] order insert:", insertError);
        throw insertError;
      }

      if (userId) {
        const patientLabel = `${resolvedFirstName} ${resolvedLastName}`.trim() || "Patient";
        const sync = await syncEnrollmentVitalsToReadings(userId, patientLabel, patientVitals);
        if (!sync.ok && sync.error) {
          console.warn("[Shop] vital_readings sync:", sync.error);
        }
      }

      if (needsVideo && schedulingRef) {
        const { error: mergeErr } = await invokeEdgeFunction("merge-scheduling-pending", {
          body: { order_number: freshOrderRef, scheduling_ref: schedulingRef },
        });
        if (mergeErr) console.warn("[Shop] merge-scheduling-pending:", mergeErr.message);
      }

      if (stripePaymentIntentId) {
        const { error: attachErr } = await invokeEdgeFunction("stripe-attach-order", {
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

    } catch (err: unknown) {
      console.error("[Enrollment error]", err);
      setError(toCustomerMessage(err, "enrollment"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === "confirmed" && selected) {
    return (
      <EnrollmentFlowShell centered className="space-y-5 pt-8">
        <PatientShopTopChrome
          stage={stage}
          onBack={() => navigate("/patient")}
          backLabel="Back to portal"
        />
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
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order Ref</span><span className="font-mono font-bold text-primary">{submittedOrderRef || '—'}</span></div>
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
      </EnrollmentFlowShell>
    );
  }



  if (stage === "account_setup" && selected) {
    return (
      <EnrollmentFlowShell className="space-y-6 pt-4">
        <PatientShopTopChrome
          stage={stage}
          onBack={() => goToStage("payment_confirmation")}
          backLabel="Back"
        />
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100 mb-4">
            <CheckCircle2 className="h-3.5 w-3.5" /> Payment Successful
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your payment is secured. Let's finish creating your account so you can track your prescription and message your doctor.
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
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-2">Vital signs</p>
        <p className="text-xs text-muted-foreground -mt-2">
          Enter your latest readings if you have them — they sync to your chart and your doctor&apos;s vitals hub.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">BP systolic</label>
            <input type="number" value={bpSys} onChange={e => setBpSys(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="120" min="70" max="220" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">BP diastolic</label>
            <input type="number" value={bpDia} onChange={e => setBpDia(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="80" min="40" max="140" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Heart rate</label>
            <input type="number" value={restingHr} onChange={e => setRestingHr(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="72" min="40" max="200" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">SpO₂ (%)</label>
            <input type="number" value={spo2} onChange={e => setSpo2(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="98" min="80" max="100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Temp (°F)</label>
            <input type="number" step="0.1" value={tempF} onChange={e => setTempF(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="98.6" min="95" max="106" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Glucose (mg/dL)</label>
            <input type="number" value={glucose} onChange={e => setGlucose(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="95" min="50" max="400" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Respiratory rate (/min)</label>
            <input type="number" value={respRate} onChange={e => setRespRate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary" placeholder="16" min="8" max="40" />
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
            I agree to Peak Health&apos;s{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">
              Privacy Policy
            </a>
            . I consent to telehealth services and electronic prescriptions.
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
          if (!dob) missing.push("Date of birth");
          if (!sex) missing.push("Sex at birth");
          if (!phone || phone.replace(/\D/g,'').length < 10) missing.push("Phone number (10 digits)");
          if (!agreedToTerms) missing.push("Agreement to Terms of Service");
          return missing.length > 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-1">
              <p className="font-bold">Please complete the following to continue:</p>
              {missing.map(m => <p key={m} className="flex items-center gap-1.5">• {m}</p>)}
            </div>
          ) : null;
        })()}

        <Button className="w-full rounded-xl h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white"
          disabled={!dob || !sex || !password || password.length < 6 || !agreedToTerms || !phone || phone.replace(/\D/g,'').length < 10}
          onClick={() => {
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              goToStage("identity");
            } else {
              goToStage("2fa");
            }
          }}>
          Continue to Phone Verification <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </EnrollmentFlowShell>
    );
  }

  if (stage === "2fa" && selected) {
    return (
      <EnrollmentFlowShell className="space-y-6 pt-8">
        <PatientShopTopChrome
          stage={stage}
          onBack={() => goToStage("account_setup")}
          backLabel="Back"
        />
        <div className="text-center">
          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShieldCheck className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold">Verify your phone</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a 6-digit code to<br />
            <span className="font-bold text-foreground">{phone || "(555) 000-0000"}</span>
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            ⚡ Demo Mode: Type any 6 digits to instantly bypass
          </div>
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
                // simulated latency for feel
                await new Promise((resolve) => setTimeout(resolve, 800));
                goToStage('identity');
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
                await invokeEdgeFunction("send-otp", { requireSession: false, body: { phone: e164 } });
              }}
            >
              Resend SMS
            </button>
          </p>
        </div>
      </EnrollmentFlowShell>
    );
  }

  if (stage === "identity" && selected) {
    return (
      <EnrollmentFlowShell className="space-y-6 pt-8">
        <PatientShopTopChrome
          stage={stage}
          onBack={() => {
            const currentUser = useAuthStore.getState().user;
            if (currentUser) goToStage("payment_confirmation");
            else goToStage("2fa");
          }}
          backLabel="Back"
        />

        <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <ShieldCheck className="h-32 w-32" />
           </div>

           <div className="flex items-center gap-2 mb-2">
             <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 text-[10px] font-black uppercase">
               Powered by Stripe Identity™
             </Badge>
           </div>
           <h1 className="text-2xl font-bold mt-4">Identity Verification</h1>
           <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
             To comply with KYC and telemedicine regulations, we need to quickly verify your identity using a government-issued ID. This usually takes less than 60 seconds.
           </p>
           
           <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 font-semibold">
             ⚡ Demo Mode: Clicking "Verify My Identity" will simulate a successful Stripe Identity scan and verification.
           </div>

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
                    // DEMO MODE: short simulated scan to feel realistic, then pass successfully
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    setIdentityStripeCompleted(true);
                    goToStage("questionnaire");
                  } catch (e: unknown) {
                    setError(toCustomerMessage(e));
                  } finally {
                    setIsVerifyingIdentity(false);
                  }
                }}
              >
                {isVerifyingIdentity ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-400" /> Simulating ID Scan...
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
      </EnrollmentFlowShell>
    );
  }

  if (stage === "payment" && selected) {
    const weightLoss = selected.category === "Weight Loss";
    const displayedGateways: string[] =
      requireStripeOnly
        ? (selected.gateways || []).filter((g: string) => g === "stripe")
        : selected.gateways || ["stripe"];

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
        <EnrollmentFlowShell className="space-y-5 pb-8">
          <PatientShopTopChrome
            stage={stage}
            onBack={() => goToStage("catalog")}
            backLabel="Back to catalog"
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
            Before checkout
          </p>
          <p className="text-sm text-muted-foreground">
            Quick eligibility and shipping confirmation. You will enter payment on the next screen.
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
        </EnrollmentFlowShell>
      );
    }

    if (displayedGateways.length === 0) {
      return (
        <EnrollmentFlowShell centered className="space-y-4 p-6">
          <PatientShopTopChrome
            stage={stage}
            onBack={() => goToStage("catalog")}
            backLabel="Back to catalog"
          />
          <p className="text-sm text-muted-foreground">
            Card checkout is not configured for this product. Please contact support.
          </p>
          <Button variant="outline" onClick={() => goToStage("catalog")}>
            Back to catalog
          </Button>
        </EnrollmentFlowShell>
      );
    }

    return (
      <EnrollmentFlowShell className="space-y-5 pb-10">
        <PatientShopTopChrome
          stage={stage}
          onBack={() => goToStage("catalog")}
          backLabel="Back to catalog"
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
          ← Edit eligibility & contact
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

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
            Select payment method
          </p>
          <div className="space-y-2">
            {displayedGateways.map((gw: string) => (
              <button
                key={gw}
                type="button"
                onClick={() => setGateway(gw)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                  gateway === gw
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                )}
              >
                <span className="text-2xl">{gatewayConfig[gw]?.icon}</span>
                <span className="font-semibold text-sm">{gatewayConfig[gw]?.label}</span>
                {gateway === gw && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {requireStripeOnly && (
          <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
            Live checkout accepts card payments through Stripe only.
          </p>
        )}

        {gateway && gateway !== "stripe" && !allowSimulatedAltGateway && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Please select <strong>Credit / Debit Card</strong> to complete checkout in this environment.
          </div>
        )}

        {gateway && gateway !== "stripe" && allowSimulatedAltGateway && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
              Demo card (not charged)
            </p>
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
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary bg-white text-gray-900 tracking-widest"
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
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary bg-white text-gray-900 tracking-widest"
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
          </div>
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
        ) : gateway === "stripe" && !stripePromise ? (
          <p className="text-xs text-center text-amber-700 font-semibold">
            Stripe is not configured (missing publishable key). Add{" "}
            <code className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</code> or use a demo gateway in development.
          </p>
        ) : !gateway ? (
          <p className="text-xs text-center text-muted-foreground">Select a payment method above.</p>
        ) : null}

        {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}
      </EnrollmentFlowShell>
    );
  }

  if (stage === "payment_confirmation" && selected) {
    return (
      <EnrollmentFlowShell className="space-y-6 pt-6 pb-12 text-center">
        <PatientShopTopChrome
          stage={stage}
          onBack={() => goToStage("payment")}
          backLabel="Back"
        />
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Payment received</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Thank you{firstName ? `, ${firstName}` : ""}. Your subscription payment for{" "}
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
                <span className="font-semibold">{gatewayConfig[gateway]?.label ?? gateway}</span>
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
              goToStage("identity");
            } else {
              goToStage("account_setup");
            }
          }}
        >
          Continue <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </EnrollmentFlowShell>
    );
  }


  if (stage === "questionnaire" && selected && (totalQ === 0 || currentQ)) {
    const onLastIntakeStep = totalQ === 0 || qStep === totalQ - 1;
    const showScheduler = needsScheduledVideo && onLastIntakeStep;
    
    const isCurrentQUnanswered = currentQ?.required && (() => {
      const raw = answers[currentQ.id];
      return raw == null || raw === "" || (Array.isArray(raw) && raw.length === 0);
    })();

    return (
      <EnrollmentFlowShell wide className="space-y-5">
        <PatientShopTopChrome
          stage={stage}
          onBack={() => {
            if (totalQ > 0 && qStep > 0) setQStep((q) => q - 1);
            else goToStage("identity");
          }}
          backLabel={totalQ > 0 && qStep > 0 ? "Previous question" : "Back"}
        />
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold">{selected.name}</h1>
            {totalQ > 0 ? (
              <span className="text-xs text-muted-foreground">{qStep + 1} / {totalQ}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Intake</span>
            )}
          </div>
          {totalQ > 0 && (
            <div className="flex gap-1">
              {visibleQuestions.map((_, i) => (
                <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= qStep ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
          )}
        </div>
        {intakeRouting ? <IntakeRoutingBanner routing={intakeRouting} /> : null}
        {(intakeEffects?.warnings.length ?? 0) > 0 ? (
          <div className="space-y-2">
            {intakeEffects!.warnings.map((w) => (
              <div
                key={w}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
              >
                {w}
              </div>
            ))}
          </div>
        ) : null}
        {currentQ && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <p className="font-semibold text-sm">
              {currentQ.label}
              {currentQ.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            {currentQ.type === "text" && (
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary"
                placeholder="Your answer..."
                value={typeof answers[currentQ.id] === "string" ? answers[currentQ.id] : ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              />
            )}
            {currentQ.type === "number" && (
              <input
                type="number"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary"
                placeholder="0"
                value={typeof answers[currentQ.id] === "string" ? answers[currentQ.id] : ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              />
            )}
            {currentQ.type === "textarea" && (
              <textarea
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary resize-none"
                placeholder="Describe in detail..."
                value={typeof answers[currentQ.id] === "string" ? answers[currentQ.id] : ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              />
            )}
            {currentQ.type === "select" && (
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm text-gray-900 focus:outline-none focus:border-primary"
                value={typeof answers[currentQ.id] === "string" ? answers[currentQ.id] : ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              >
                <option value="">Select an option...</option>
                {currentQ.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}
            {currentQ.type === "radio" && currentQ.options?.map(o => (
              <label key={o} className={cn("flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all",
                answers[currentQ.id] === o ? "border-primary bg-primary/5" : "border-border hover:bg-accent")}>
                <input type="radio" name={currentQ.id} value={o} className="accent-primary"
                  checked={answers[currentQ.id] === o}
                  onChange={() => handleAnswer(currentQ.id, o)} />
                <span className="text-sm">{o}</span>
              </label>
            ))}
            {currentQ.type === "checkbox" && currentQ.options?.map(o => {
              const selectedVals = answers[currentQ.id];
              const checked = Array.isArray(selectedVals)
                ? selectedVals.includes(o)
                : selectedVals === o;
              return (
              <label key={o} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-accent">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={checked}
                  onChange={(e) => handleCheckboxAnswer(currentQ.id, o, e.target.checked)}
                />
                <span className="text-sm">{o}</span>
              </label>
              );
            })}
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
        {showScheduler && schedulingEmbedSrc && (
          <>
            <PatientSchedulingPanel
              embedSrc={schedulingEmbedSrc}
              rawBookingUrl={
                assignedDoctorForScheduling?.calendly_url ||
                videoRules?.schedulingEmbedUrl ||
                DEFAULT_CALENDLY_BOOKING_URL
              }
              doctorName={assignedDoctorForScheduling?.full_name}
              doctorHint={state ? `Clinician licensed for ${state.toUpperCase()}` : undefined}
              doctorMatchPending={!assignedDoctorForScheduling}
              schedulingRefTail={schedulingRef ? schedulingRef.slice(-10) : null}
              onCalendlyBookingConfirmed={() => setBookingAttestation(true)}
            />
            <label className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-emerald-600 shrink-0"
                checked={bookingAttestation}
                onChange={(e) => setBookingAttestation(e.target.checked)}
              />
              <span className="text-sm text-emerald-950">
                {bookingAttestation
                  ? "Booking detected — you can continue enrollment."
                  : "Confirm you selected a time above, or wait for the calendar to register your booking automatically."}
              </span>
            </label>
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">ID verification</p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                   <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">Government ID or Stripe Identity</p>
                  {idFile ? (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ {idFile.name}</p>
                  ) : identityStripeCompleted ? (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Stripe Identity completed</p>
                  ) : (
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">
                      Upload ID in the identity step or complete Stripe Identity.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold text-center">
            ⚠️ {error}
          </div>
        )}
        {isCurrentQUnanswered && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold text-center animate-in slide-in-from-bottom-2">
            ⚠️ Please answer the required question to continue.
          </div>
        )}
        <Button
          className="w-full rounded-xl h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          disabled={isSubmitting || isCurrentQUnanswered}
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
      </EnrollmentFlowShell>
    );
  }

  return (
    <div className="patient-enrollment-surface min-h-[100dvh] bg-[#F4F7F5]">
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-10 space-y-6 pb-20 pt-6 sm:pt-8">
      <PatientEnrollmentCatalogChrome stage={stage} onBack={() => navigate("/patient")} />

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
    </div>
  );
}
