import { useEffect } from "react";
import { ExternalLink, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/shared.tsx";
import {
  REFERLY_MERCHANT_CONSOLE_URL,
  referlyPartnerPortalUrl,
} from "../../../lib/referly";

/**
 * Affiliate partners are managed on Referly's white-label portal — not Supabase auth.
 * `/affiliate` and `/affiliate/login` forward partners to that dashboard.
 */
export function AffiliateReferlyRedirect() {
  const partnerUrl = referlyPartnerPortalUrl();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace(partnerUrl);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [partnerUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2E1F] via-[#153e2d] to-[#051810] flex flex-col items-center justify-center px-6 text-center">
      <img
        src="/originallogo.png"
        alt="Peak Health"
        className="h-14 object-contain opacity-90 mb-10"
      />

      <div className="max-w-lg space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-400/30 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-200">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Referly.so
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
          Opening your affiliate portal…
        </h1>

        <p className="text-sm text-emerald-100/70 leading-relaxed">
          Peak Health partners sign in on our Referly-powered dashboard for referral links,
          conversion tracking, and payouts. You will be redirected automatically.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => {
              window.location.href = partnerUrl;
            }}
            className="h-12 px-8 rounded-xl bg-white text-[#0A2E1F] hover:bg-emerald-50 font-black uppercase text-[10px] tracking-widest gap-2"
          >
            Open Partner Portal
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/";
            }}
            className="h-12 px-6 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-widest"
          >
            Back to Peak Health
          </Button>
        </div>

        <p className="text-[10px] text-emerald-200/40 font-mono pt-4">{partnerUrl}</p>
      </div>

      <div className="mt-16 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300/50">
        <ShieldCheck className="h-4 w-4" />
        Merchant console: {REFERLY_MERCHANT_CONSOLE_URL.replace("https://", "")}
      </div>
    </div>
  );
}
