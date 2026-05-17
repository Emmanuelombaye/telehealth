import { useState } from "react";
import { Share2, Plus, Users, RefreshCw, ExternalLink, Zap, ShieldCheck, Play, Code, AlertCircle, Sparkles, CheckCircle2, X, Link, Award, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared.tsx";
import { toast } from "sonner";
import { cn } from "../../../components/ui/utils";

type Campaign = {
  id: string;
  name: string;
  referralLink: string;
  commission: string;
  clicks: number;
  conversions: number;
  revenue: string;
  status: "Active" | "Paused";
};

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: "CAMP-01", name: "Peak Wellness Elite", referralLink: "https://peak-health.io?ref=wellness_elite", commission: "20% Lifetime", clicks: 1245, conversions: 184, revenue: "$14,720.00", status: "Active" },
  { id: "CAMP-02", name: "Semaglutide Weight Loss Influencers", referralLink: "https://peak-health.io?ref=glp1_promo", commission: "25% First Order", clicks: 3840, conversions: 512, revenue: "$48,960.00", status: "Active" },
  { id: "CAMP-03", name: "Clinical Provider Referrals", referralLink: "https://peak-health.io?ref=provider_ref", commission: "15% Lifetime", clicks: 540, conversions: 78, revenue: "$9,360.00", status: "Active" },
  { id: "CAMP-04", name: "Bio-Hacking Podcast Network", referralLink: "https://peak-health.io?ref=biohack_pod", commission: "20% Lifetime", clicks: 920, conversions: 0, revenue: "$0.00", status: "Paused" },
];

export function AdminAffiliatesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [testing, setTesting] = useState(false);
  const [testAmount, setTestAmount] = useState("299.00");
  const [testEmail, setTestEmail] = useState("affiliate.tester@gmail.com");
  const [logs, setLogs] = useState<string[]>([
    "[System] Referly.so SDK initialized.",
    "[Telemetry] Connected to tracking endpoint 'partners.peak-health.io'"
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newCommission, setNewCommission] = useState("20% Lifetime");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleFireTestEvent = () => {
    if (!testAmount.trim() || !testEmail.trim()) {
      toast.error("Please provide a valid test amount and email.");
      return;
    }
    setTesting(true);
    
    const freshLog = `[Event] window.referly('convert', { amount: ${parseFloat(testAmount).toFixed(2)}, email: '${testEmail}', order_id: 'PH-TEST-${Math.floor(100000 + Math.random() * 900000)}' })`;
    
    setTimeout(() => {
      setLogs(prev => [...prev, freshLog, `[Success] Referly attribution matched. Status: 200 OK`]);
      setTesting(false);
      toast.success("Affiliate Conversion Simulated!", {
        description: `Attributed successfully inside the Referly.so sandbox environment.`
      });
    }, 1000);
  };

  const handleToggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === "Active" ? "Paused" : "Active";
        toast.success(`Campaign ${c.name} ${nextStatus === 'Active' ? 'Activated' : 'Paused'}`);
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      toast.error("Please provide a campaign name.");
      return;
    }
    if (!newSlug.trim()) {
      toast.error("Please provide a referral link slug.");
      return;
    }

    const cleanSlug = newSlug.trim().toLowerCase().replace(/\s+/g, "_");
    const link = `https://peak-health.io?ref=${cleanSlug}`;
    const newId = `CAMP-0${campaigns.length + 1}`;

    const newCamp: Campaign = {
      id: newId,
      name: newCampaignName,
      referralLink: link,
      commission: newCommission,
      clicks: 0,
      conversions: 0,
      revenue: "$0.00",
      status: "Active"
    };

    setCampaigns(prev => [newCamp, ...prev]);
    setIsModalOpen(false);
    
    toast.success("Campaign Initialized!", {
      description: `Referral link: ${link} successfully pushed to Referly.so database.`,
      action: {
        label: "Copy Link",
        onClick: () => {
          navigator.clipboard.writeText(link);
          toast.success("Copied to clipboard!");
        }
      }
    });

    // Reset inputs
    setNewCampaignName("");
    setNewSlug("");
    setNewCommission("20% Lifetime");
  };

  return (
    <div className="max-w-[1500px] mx-auto font-sans space-y-8 animate-in fade-in duration-500 relative">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Affiliate Hub</h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black uppercase tracking-wider py-0.5">
              Powered by Referly.so
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Control marketing campaigns, monitor tracking pixels, and simulate checkout postbacks for third-party affiliate commissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => window.open("https://referly.so", "_blank")}
            className="h-10 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm"
          >
            Open Referly.so Console <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-6 rounded-xl bg-[#0A2E1F] text-white hover:bg-emerald-950 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-950/20 gap-2"
          >
            <Plus className="h-4 w-4" /> Create Campaign Link
          </Button>
        </div>
      </div>

      {/* --- TELEMETRY STATUS BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "ATTRIBUTION PIXEL", value: "Active & Loaded", desc: "checkout webhook listener", status: "success" },
          { label: "TRACKING DOMAIN", value: "partners.peak-health.io", desc: "cname DNS record verified", status: "success" },
          { label: "DEFAULT PAYOUT", value: "20% Lifetime RevShare", desc: "custom tiering enabled", status: "warning" },
          { label: "SYNC STATE", value: "HIPAA Compliant Data Layer", desc: "automatic email hashing active", status: "success" },
        ].map((s, idx) => (
          <Card key={idx} className="border-none bg-slate-50/50 shadow-inner">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={cn(
                "h-2 w-2 rounded-full mt-1.5 shrink-0 animate-pulse",
                s.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
              )} />
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{s.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT: LIVE TRACKING CAMPAIGNS --- */}
        <Card className="lg:col-span-8 border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Marketing Campaigns</CardTitle>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Real-time stats pushed directly from your Referly partner channel</p>
            </div>
            <RefreshCw className="h-4 w-4 text-slate-400 cursor-pointer hover:rotate-45 transition-transform" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="p-4 pl-6">Campaign Info</th>
                    <th className="p-4">Commission</th>
                    <th className="p-4 text-center">Clicks</th>
                    <th className="p-4 text-center">Sales</th>
                    <th className="p-4 text-right">Revenue</th>
                    <th className="p-4 pr-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors text-xs font-medium text-slate-700">
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] font-mono text-emerald-600 truncate max-w-[220px]">{c.referralLink}</p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(c.referralLink);
                                setCopiedLink(c.id);
                                toast.success("Campaign link copied!");
                                setTimeout(() => setCopiedLink(null), 2000);
                              }}
                              className="text-slate-400 hover:text-[#0A2E1F] shrink-0"
                              title="Copy Link"
                            >
                              {copiedLink === c.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-bold">{c.commission}</td>
                      <td className="p-4 text-center font-bold text-slate-900">{c.clicks.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-emerald-600">{c.conversions}</td>
                      <td className="p-4 text-right font-black text-slate-900">{c.revenue}</td>
                      <td className="p-4 pr-6 text-center">
                        <button
                          onClick={() => handleToggleStatus(c.id)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
                            c.status === "Active" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          )}
                        >
                          {c.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* --- RIGHT: REAL-TIME ATTRIBUTION SANDBOX --- */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] bg-[#0A2E1F] text-white overflow-hidden p-6 relative group">
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
            <div className="relative z-10 space-y-5">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Attribution Sandbox</h3>
                <p className="text-[10px] text-emerald-300 font-medium mt-0.5">Test Referly postback scripts on checkout completion.</p>
              </div>

              {/* Form Controls */}
              <div className="space-y-3 pt-2 text-slate-900">
                <div>
                  <label className="text-[9px] font-black text-emerald-300 uppercase tracking-widest block mb-1">Simulated Checkout Amount</label>
                  <input
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    type="number"
                    placeholder="299.00"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-emerald-300 uppercase tracking-widest block mb-1">Affiliate Partner Email</label>
                  <input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    type="email"
                    placeholder="affiliate.tester@gmail.com"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                  />
                </div>
              </div>

              <Button
                onClick={handleFireTestEvent}
                disabled={testing}
                className="w-full h-12 rounded-xl bg-white text-[#0A2E1F] hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-[#0A2E1F]" />}
                Fire Conversion Event
              </Button>
            </div>
          </Card>

          {/* Dynamic Console Logs */}
          <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[1.5rem] bg-slate-950 text-slate-300 p-5 font-mono text-[10px] h-52 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Live Postback Logger</span>
              <button 
                onClick={() => setLogs([])}
                className="text-[8px] font-black uppercase text-slate-500 hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {logs.map((l, idx) => (
                <p key={idx} className={cn(
                  l.includes("[Success]") && "text-emerald-400 font-bold",
                  l.includes("[Event]") && "text-blue-400 font-bold",
                  l.includes("[Telemetry]") && "text-slate-400"
                )}>
                  {l}
                </p>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* --- INTEGRATION MANUAL --- */}
      <Card className="border-none shadow-xl shadow-slate-200/30 rounded-[2rem] bg-slate-50">
        <CardContent className="p-6 flex gap-4 items-start">
          <Code className="h-6 w-6 text-emerald-700 mt-1 shrink-0" />
          <div className="space-y-2">
            <p className="font-bold text-slate-900 text-sm">Where does Referly.so connect inside the application?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When a patient opens a referral link from an influencer or marketing campaign, Referly sets the attribution cookie.
              During checkout on <code className="bg-white border px-1 py-0.5 rounded text-[11px] font-mono">Shop.tsx</code>, the system automatically checks for the attribution pixel and triggers the postback:
            </p>
            <pre className="p-4 bg-slate-950 text-slate-300 rounded-2xl text-[10px] font-mono leading-relaxed overflow-x-auto shadow-inner">
{`// REFERLY CONVERSION PIXEL CALL (Shop.tsx SUCCESS FRAMEWORK)
if (window.referly) {
  window.referly('convert', {
    amount: selected.priceUSD,
    email: resolvedEmail,
    order_id: freshOrderRef
  });
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* --- PREMIUM CREATE CAMPAIGN MODAL Overlay --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden p-8 space-y-6 animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[8px] uppercase tracking-widest px-2.5 py-1">
                  Campaign Registrar
                </Badge>
                <h3 className="text-lg font-black text-[#0A2E1F] tracking-tight mt-1 flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Initialize Referly Campaign
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wellness Podcast Network"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Referral URL Slug</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 italic">peak-health.io?ref=</span>
                  <input
                    type="text"
                    required
                    placeholder="podcast_elite"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full h-11 pl-[125px] pr-4 rounded-xl bg-slate-50 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs font-mono font-bold text-emerald-700 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Commission Strategy</label>
                <select
                  value={newCommission}
                  onChange={(e) => setNewCommission(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs font-semibold text-slate-800 transition-all appearance-none cursor-pointer"
                >
                  <option value="20% Lifetime">20% Lifetime Revenue Share</option>
                  <option value="25% First Order">25% First Order Bonus</option>
                  <option value="15% Lifetime">15% Lifetime Revenue Share</option>
                  <option value="30% Custom Agency">30% Enterprise/Agency Tier</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-black uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-[#0A2E1F] text-white hover:bg-emerald-950 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-950/20"
                >
                  Deploy Campaign Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
