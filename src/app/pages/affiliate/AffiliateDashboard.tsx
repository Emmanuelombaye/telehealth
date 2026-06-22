import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../components/ui/shared.tsx";
import {
  REFERLY_MERCHANT_CONSOLE_URL,
  isReferlyTrackingConfigured,
  referlyPartnerPortalUrl,
} from "../../../lib/referly";
import {
  REFERLY_CHART_DATA,
  REFERLY_DEMO_PARTNER,
  REFERLY_MOCK_ASSETS,
  REFERLY_MOCK_PAYOUTS,
  REFERLY_MOCK_REFERRALS,
  REFERLY_SYNC_STATUS,
  buildPeakReferralLink,
} from "../../../lib/referlyMock";

type AffiliateTab = "overview" | "referrals" | "payouts" | "assets" | "settings";

function tabFromPath(pathname: string): AffiliateTab {
  if (pathname.includes("/referrals")) return "referrals";
  if (pathname.includes("/payouts")) return "payouts";
  if (pathname.includes("/assets")) return "assets";
  if (pathname.includes("/settings")) return "settings";
  return "overview";
}

function pathForTab(tab: AffiliateTab): string {
  if (tab === "overview") return "/affiliate";
  return `/affiliate/${tab}`;
}

const TABS: { id: AffiliateTab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "referrals", label: "Referrals", icon: Users },
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "assets", label: "Assets", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings },
];

/** Referly-branded affiliate portal — demo data until live Referly API sync. */
export function AffiliateDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabFromPath(location.pathname);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const referralLink = buildPeakReferralLink(REFERLY_DEMO_PARTNER.referralSlug);
  const trackingLive = isReferlyTrackingConfigured();

  const copyRefLink = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1200);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      {/* Referly integration header */}
      <Card className="border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-white rounded-[2rem] overflow-hidden shadow-sm">
        <CardContent className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-wider border-emerald-200 text-emerald-700">
                {trackingLive ? "Tracking live" : "Sync pending"}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-[#0A2E1F] tracking-tight">
              Affiliate Partner Dashboard
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Referral links, click tracking, checkout attribution, and payouts are managed through Referly.
              Partners sign in on{" "}
              <span className="font-mono text-emerald-800">{REFERLY_SYNC_STATUS.partnerPortal}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={simulateSync}
              disabled={syncing}
              className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              {syncing ? "Syncing…" : "Sync Referly"}
            </Button>
            <Button
              onClick={() => window.open(referlyPartnerPortalUrl(), "_blank")}
              className="h-11 px-5 rounded-xl bg-[#0A2E1F] hover:bg-[#051810] text-white font-black uppercase text-[10px] tracking-widest gap-2"
            >
              Open Referly Portal
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync telemetry strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Attribution", value: REFERLY_SYNC_STATUS.tracking, ok: true },
          { label: "Partner domain", value: REFERLY_SYNC_STATUS.partnerPortal, ok: true },
          { label: "Checkout hook", value: "referly('convert')", ok: trackingLive },
          { label: "Last sync", value: syncing ? "Syncing…" : REFERLY_SYNC_STATUS.lastSync, ok: !syncing },
        ].map((item) => (
          <Card key={item.label} className="border-none bg-slate-50/80 shadow-inner rounded-2xl">
            <CardContent className="p-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("h-2 w-2 rounded-full", item.ok ? "bg-emerald-500" : "bg-amber-500")} />
                <p className="text-xs font-bold text-slate-800 truncate">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate(pathForTab(id))}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
              activeTab === id
                ? "bg-[#0A2E1F] text-white shadow-lg shadow-emerald-900/20"
                : "text-slate-400 hover:text-[#0A2E1F] hover:bg-slate-50",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4 bg-gradient-to-br from-[#0A2E1F] to-[#153e2d] border-none text-white rounded-[2rem] p-8 shadow-xl">
              <p className="text-[10px] font-black text-emerald-300/70 uppercase tracking-widest">Referly wallet balance</p>
              <p className="text-5xl font-black mt-2 tracking-tight">
                ${REFERLY_DEMO_PARTNER.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-emerald-100/60 mt-4">{REFERLY_DEMO_PARTNER.tier} · {REFERLY_DEMO_PARTNER.commission}</p>
              <p className="text-[10px] text-emerald-200/50 mt-6 uppercase tracking-widest">
                Next payout · {REFERLY_DEMO_PARTNER.nextPayout}
              </p>
            </Card>

            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
              {[
                { label: "Clicks (30d)", value: REFERLY_DEMO_PARTNER.clicks.toLocaleString() },
                { label: "Conversions", value: REFERLY_DEMO_PARTNER.conversions.toLocaleString() },
                { label: "Conversion rate", value: `${REFERLY_DEMO_PARTNER.conversionRate}%` },
                { label: "Link CTR", value: `${REFERLY_DEMO_PARTNER.ctr}%` },
              ].map((stat) => (
                <Card key={stat.label} className="rounded-[1.5rem] border-none shadow-md shadow-slate-200/40">
                  <CardContent className="p-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-[#0A2E1F] mt-1">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 rounded-[2rem] border-none shadow-xl shadow-slate-200/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-[#0A2E1F]">
                  Revenue from Referly-attributed orders
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px] pb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REFERLY_CHART_DATA}>
                    <defs>
                      <linearGradient id="referlyRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#0A2E1F" strokeWidth={3} fill="url(#referlyRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 rounded-[2rem] bg-[#D4AF37] text-[#0A2E1F] border-none shadow-lg">
              <CardContent className="p-8 space-y-4">
                <Share2 className="h-8 w-8 opacity-80" />
                <h3 className="text-xl font-black">Your referral link</h3>
                <p className="text-xs font-medium opacity-80">Tracked by Referly when patients checkout.</p>
                <div className="bg-[#0A2E1F]/10 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-[11px] font-mono truncate flex-1">{referralLink}</span>
                  <button type="button" onClick={copyRefLink} className="shrink-0">
                    {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "referrals" && (
        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" /> Referly-attributed conversions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-50">
            {REFERLY_MOCK_REFERRALS.map((row) => (
              <div key={row.patient + row.time} className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-[#0A2E1F]">{row.product}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{row.patient} · {row.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">{row.commission}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{row.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "payouts" && (
        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-xs font-black uppercase tracking-widest">Payout history (Referly wallet)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-50">
            {REFERLY_MOCK_PAYOUTS.map((row) => (
              <div key={row.date} className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-[#0A2E1F]">{row.date}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{row.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#0A2E1F]">{row.amount}</p>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase">{row.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "assets" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REFERLY_MOCK_ASSETS.map((asset) => (
            <Card key={asset.title} className="rounded-[1.5rem] border-none shadow-md overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <Badge variant="outline" className="text-[8px] font-black uppercase">{asset.type}</Badge>
                <h3 className="font-black text-[#0A2E1F]">{asset.title}</h3>
                <p className="text-[10px] text-slate-400">{asset.size}</p>
                <Button variant="outline" className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "settings" && (
        <Card className="rounded-[2rem] border-none shadow-lg max-w-2xl">
          <CardContent className="p-8 space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner</p>
              <p className="font-bold text-[#0A2E1F] mt-1">{REFERLY_DEMO_PARTNER.name}</p>
              <p className="text-sm text-slate-500">{REFERLY_DEMO_PARTNER.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referly program</p>
              <p className="text-sm text-slate-600 mt-1">{REFERLY_DEMO_PARTNER.commission}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(REFERLY_MERCHANT_CONSOLE_URL, "_blank")}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
            >
              Manage on Referly.so <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
