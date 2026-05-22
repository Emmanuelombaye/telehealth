import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Eye,
  Loader2,
  FileKey,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import type { PhiAccessLogRow } from "../../../../lib/phiAccessAudit";
import { toast } from "sonner";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
  status: "verified" | "pending";
};

type PrivacyPanel = "encryption" | "access" | "hipaa" | null;

export function IdentityPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<Record<string, unknown> | null>(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [profile, setProfile] = useState<{ address?: string; phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(false);
  const [panel, setPanel] = useState<PrivacyPanel>(null);
  const [accessLogs, setAccessLogs] = useState<PhiAccessLogRow[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessTableMissing, setAccessTableMissing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [idRes, orderRes, profileRes] = await Promise.all([
        supabase.from("identity_verification").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("orders")
          .select("kyc_status, order_number")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("profiles").select("address, phone").eq("id", user.id).maybeSingle(),
      ]);

      if (!idRes.error) setVerification(idRes.data as Record<string, unknown> | null);
      const kyc = (orderRes.data?.kyc_status as string) || "";
      setKycVerified(kyc === "verified" || (idRes.data as { status?: string } | null)?.status === "verified");
      setProfile(profileRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checklist = useMemo((): ChecklistItem[] => {
    const idOk = kycVerified;
    const addressOk = !!(profile?.address && String(profile.address).trim().length > 8);
    const phoneOk = !!(profile?.phone && String(profile.phone).replace(/\D/g, "").length >= 10);
    return [
      {
        id: "gov_id",
        label: "Government-issued ID",
        status: idOk ? "verified" : "pending",
        detail: idOk ? "Verified with Stripe Identity" : "Upload or scan your ID",
      },
      {
        id: "selfie",
        label: "Selfie / Liveness Check",
        status: idOk ? "verified" : "pending",
        detail: idOk ? "Live capture matched" : "Completed with ID verification",
      },
      {
        id: "address",
        label: "Address Verification",
        status: addressOk ? "verified" : "pending",
        detail: addressOk ? "Address on file" : "Add shipping address on your profile",
      },
      {
        id: "2fa",
        label: "Two-Factor Authentication",
        status: phoneOk ? "verified" : "pending",
        detail: phoneOk ? "SMS verification enabled" : "Add a mobile number for OTP",
      },
    ];
  }, [kycVerified, profile]);

  const isVerified =
    verification?.status === "verified" || checklist.every((c) => c.status === "verified");

  const openAccessLog = async () => {
    setPanel("access");
    if (!user) return;
    setAccessLoading(true);
    setAccessTableMissing(false);
    try {
      const { data, error } = await supabase
        .from("phi_access_logs")
        .select("*")
        .eq("subject_user_id", user.id)
        .eq("access_type", "staff")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setAccessTableMissing(true);
          setAccessLogs([]);
          return;
        }
        throw error;
      }
      setAccessLogs((data || []) as PhiAccessLogRow[]);
    } catch (e) {
      console.error(e);
      toast.error("Could not load access log.");
      setAccessLogs([]);
    } finally {
      setAccessLoading(false);
    }
  };

  const startStripeIdentity = async () => {
    if (!user) return;
    if (!stripePublishableKey) {
      toast.message("Identity verification", {
        description: "Complete verification during enrollment, or contact support to enable Stripe Identity.",
      });
      navigate("/patient/shop");
      return;
    }
    setVerifyingId(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-identity", {
        body: { userId: user.id },
      });
      if (error) throw error;
      const clientSecret = (data as { clientSecret?: string })?.clientSecret;
      if (!clientSecret) throw new Error("No verification session");

      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe) throw new Error("Stripe failed to load");

      const result = await stripe.verifyIdentity(clientSecret);
      if (result.error) throw result.error;

      const patch = {
        status: "verified",
        verified_at: new Date().toISOString(),
        document_type: "stripe_identity",
      };
      const { data: existing } = await supabase
        .from("identity_verification")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing?.id) {
        await supabase.from("identity_verification").update(patch).eq("user_id", user.id);
      } else {
        await supabase.from("identity_verification").insert({ user_id: user.id, ...patch });
      }

      setKycVerified(true);
      toast.success("Identity verified successfully.");
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error("Verification could not be completed. Try again or finish verification in enrollment.");
    } finally {
      setVerifyingId(false);
    }
  };

  const handleComplete = (item: ChecklistItem) => {
    if (item.id === "gov_id" || item.id === "selfie") {
      void startStripeIdentity();
      return;
    }
    if (item.id === "address") {
      navigate("/patient/profile");
      return;
    }
    if (item.id === "2fa") {
      navigate("/patient/profile");
      toast.message("SMS verification", {
        description: "Add your mobile number on Profile. We send a one-time code during secure sign-in and enrollment.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">Loading identity & privacy…</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl space-y-6 pb-16">
      <div
        className="pointer-events-none absolute inset-x-0 -top-6 h-48 rounded-[2rem] bg-gradient-to-b from-emerald-100/80 via-white/40 to-transparent"
        aria-hidden
      />

      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-800/70">Privacy center</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#0A2E1F]">Identity verification</h1>
        <p className="mt-1 text-sm text-slate-600">
          Secure your account and see how Peak Health protects your health information.
        </p>
      </div>

      <Card
        className={cn(
          "relative overflow-hidden border-0 shadow-lg shadow-emerald-900/5",
          isVerified ? "bg-gradient-to-br from-emerald-50 to-white" : "bg-gradient-to-br from-amber-50/90 to-white",
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                isVerified ? "bg-emerald-600 text-white" : "bg-amber-500 text-white",
              )}
            >
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn("text-lg font-bold", isVerified ? "text-emerald-900" : "text-amber-900")}>
                  {isVerified ? "Identity verified" : "Verification pending"}
                </p>
                <Badge className="border-0 bg-[#0A2E1F] text-[10px] text-white">HIPAA aligned</Badge>
              </div>
              {isVerified && verification?.verified_at ? (
                <p className="mt-1 text-xs text-emerald-800">
                  Verified {new Date(String(verification.verified_at)).toLocaleDateString()}
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-900/80">
                  Complete the checklist below to unlock full telehealth services.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-bold text-[#0A2E1F]">Verification checklist</p>
          {checklist.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
                item.status === "verified"
                  ? "border-emerald-200/80 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50/80",
              )}
            >
              {item.status === "verified" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Clock className="h-5 w-5 shrink-0 text-amber-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
              {item.status === "pending" && (
                <Button
                  size="sm"
                  className="h-8 shrink-0 rounded-xl bg-[#0A2E1F] px-4 text-[11px] font-bold text-white hover:bg-emerald-950"
                  disabled={verifyingId && (item.id === "gov_id" || item.id === "selfie")}
                  onClick={() => handleComplete(item)}
                >
                  {verifyingId && (item.id === "gov_id" || item.id === "selfie") ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Complete"
                  )}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-bold text-[#0A2E1F]">Privacy & data rights</p>
          {[
            {
              key: "encryption" as const,
              icon: Lock,
              label: "Data encryption",
              desc: "TLS in transit and encrypted storage on our HIPAA-aligned cloud platform.",
            },
            {
              key: "access" as const,
              icon: Eye,
              label: "Access log",
              desc: "See when care team members opened your chart (accounting of disclosures).",
            },
            {
              key: "hipaa" as const,
              icon: ShieldCheck,
              label: "HIPAA rights",
              desc: "Request a copy of your records or ask about privacy practices.",
            },
          ].map((row) => (
            <div
              key={row.key}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50/80 to-white p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <row.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                <p className="text-xs leading-relaxed text-slate-500">{row.desc}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 rounded-xl border-emerald-200 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                onClick={() => {
                  if (row.key === "access") void openAccessLog();
                  else setPanel(row.key);
                }}
              >
                View
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={panel === "encryption"} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0A2E1F]">
              <Lock className="h-5 w-5 text-emerald-600" />
              How we protect your data
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-slate-600">
                <p>
                  Peak Health uses industry-standard <strong>TLS</strong> for all traffic between your browser and our
                  servers. Clinical data is stored on <strong>Supabase</strong> infrastructure with encryption at rest
                  and role-based access controls.
                </p>
                <p>
                  Only staff involved in your care (and authorized admins) can access your chart. Access is logged for
                  compliance review.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full rounded-xl bg-[#0A2E1F]" onClick={() => setPanel(null)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={panel === "hipaa"} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0A2E1F]">
              <FileKey className="h-5 w-5 text-emerald-600" />
              Your HIPAA rights
            </DialogTitle>
            <DialogDescription asChild>
              <ul className="list-disc space-y-2 pl-5 pt-2 text-sm text-slate-600">
                <li>Access and obtain a copy of your health records</li>
                <li>Request corrections to your information</li>
                <li>Receive an accounting of certain disclosures</li>
                <li>Request restrictions where applicable</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                setPanel(null);
                navigate("/patient/documents");
              }}
            >
              My documents
            </Button>
            <Button
              className="flex-1 rounded-xl bg-[#0A2E1F]"
              onClick={() => {
                setPanel(null);
                navigate("/patient/messages");
              }}
            >
              Message care team
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={panel === "access"} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden rounded-2xl p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-[#0A2E1F]">Who accessed your records</DialogTitle>
            <DialogDescription>
              Staff access to your chart logged for HIPAA accounting (last 100 events).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
            {accessLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            )}
            {!accessLoading && accessTableMissing && (
              <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-4">
                Access logging is being enabled on your account. Check back after your care team has reviewed your chart.
              </p>
            )}
            {!accessLoading && !accessTableMissing && accessLogs.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-8">
                No staff access logged yet. Entries appear when your clinician opens your chart, messages, or orders.
              </p>
            )}
            <ul className="space-y-3">
              {accessLogs.map((log) => (
                <li key={log.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {log.actor_email || log.role || "Care team"}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {log.action} · {log.resource_type}
                    {log.resource_id ? ` · ${log.resource_id}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-slate-100 px-6 py-3">
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setPanel(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
