import { useState, useMemo } from "react";
import { 
  TrendingUp, Users, DollarSign, ExternalLink, 
  Copy, CheckCircle2, ChevronRight, BarChart3,
  Zap, Gift, Globe, ShieldCheck, ArrowUpRight,
  MousePointer2, Target, Trophy, Clock, Wallet,
  PieChart, Activity, Sparkles, Download, Share2,
  Lock, ArrowRight, Settings, Info, FileText, MessageSquare,
  Image as ImageIcon, Receipt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../components/ui/shared.tsx";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

const chartData = [
  { name: 'Week 1', revenue: 400, clicks: 2400 },
  { name: 'Week 2', revenue: 1398, clicks: 3200 },
  { name: 'Week 3', revenue: 9800, clicks: 4500 },
  { name: 'Week 4', revenue: 3908, clicks: 2800 },
  { name: 'Week 5', revenue: 4800, clicks: 3908 },
  { name: 'Week 6', revenue: 11000, clicks: 4800 },
];

export function AffiliateDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "referrals" | "payouts" | "assets">("overview");
  const [copied, setCopied] = useState(false);

  const copyRefLink = () => {
    navigator.clipboard.writeText(`https://peak-health.io?ref=PEAK-ELITE-2026`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-32 animate-in fade-in duration-1000">
      
      {/* ── HIGH-FIDELITY NAVIGATION TABS ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 pb-6">
        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200/50 shadow-inner">
           {(["overview", "referrals", "payouts", "assets"] as const).map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2",
                 activeTab === tab 
                  ? "bg-[#0A2E1F] text-white shadow-xl shadow-emerald-900/20" 
                  : "text-slate-400 hover:text-[#0A2E1F] hover:bg-white"
               )}
             >
                {tab === 'overview' && <BarChart3 className="h-3.5 w-3.5" />}
                {tab === 'referrals' && <Users className="h-3.5 w-3.5" />}
                {tab === 'payouts' && <Wallet className="h-3.5 w-3.5" />}
                {tab === 'assets' && <Sparkles className="h-3.5 w-3.5" />}
                {tab}
             </button>
           ))}
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden lg:flex flex-col items-end mr-4">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Next Payout Cycle</p>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">May 31, 2026</p>
           </div>
           <Button className="h-12 px-6 rounded-xl bg-white border border-slate-200 text-[#0A2E1F] hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest">
             <Settings className="h-4 w-4 mr-2" /> Settings
           </Button>
           <Button className="h-12 px-8 rounded-xl bg-[#0A2E1F] text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-900/30">
             Withdraw Funds
           </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* ── HERO STATS GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               
               {/* Main Wallet Card */}
               <div className="lg:col-span-4">
                  <Card className="h-full bg-gradient-to-br from-[#0A2E1F] to-[#153e2d] border-none shadow-[0_30px_60px_rgba(10,46,31,0.3)] rounded-[3rem] p-10 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-[80px] rounded-full -mr-32 -mt-32" />
                     <div className="relative z-10 space-y-10">
                        <div className="flex items-center justify-between">
                           <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                              <Wallet className="h-7 w-7 text-[#D4AF37]" />
                           </div>
                           <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                             Emerald Partner
                           </Badge>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.3em] mb-2">Available Balance</p>
                           <h2 className="text-6xl font-black tracking-tighter">$8,440<span className="text-emerald-500/50">.50</span></h2>
                        </div>
                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                           <div>
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Total Lifetime Earned</p>
                              <p className="text-xl font-bold">$124,500.00</p>
                           </div>
                           <div className="h-12 w-12 rounded-full bg-[#D4AF37] text-[#0A2E1F] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer hover:scale-110 transition-transform">
                              <ArrowUpRight className="h-6 w-6" />
                           </div>
                        </div>
                     </div>
                  </Card>
               </div>

               {/* Stats Grid */}
               <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: "Active Referrals", value: "842", trend: "+12% this month", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Link CTR", value: "5.82%", trend: "Above Average", icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Conversion rate", value: "12.4%", trend: "+2.1% week over week", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Patient Retention", value: "94%", trend: "Exceptional Quality", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
                  ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] group hover:scale-[1.02] transition-all duration-500">
                       <CardContent className="p-8 flex items-center gap-6">
                          <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 shadow-inner", stat.bg, stat.color)}>
                            <stat.icon className="h-7 w-7" />
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <Badge className={cn("px-2 py-0 h-4 text-[7px] font-black uppercase border-none", stat.bg, stat.color)}>{stat.trend}</Badge>
                             </div>
                             <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tight">{stat.value}</h3>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>

            {/* ── REVENUE ANALYTICS ENGINE ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               
               {/* Main Chart */}
               <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-200/30 rounded-[3rem] overflow-hidden">
                  <CardHeader className="p-10 pb-0">
                     <div className="flex items-center justify-between">
                        <div>
                           <CardTitle className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-[0.4em]">Revenue Performance</CardTitle>
                           <p className="text-xs text-slate-400 font-bold mt-1">Growth tracking for Q2 2026</p>
                        </div>
                        <div className="flex gap-2">
                           <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[8px] font-black px-3 py-1.5">DAILY</Badge>
                           <Badge className="bg-[#0A2E1F] text-white border-none uppercase text-[8px] font-black px-3 py-1.5">WEEKLY</Badge>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-10 pt-4 h-[400px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                           <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" hide />
                           <YAxis hide />
                           <Tooltip 
                              contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '12px' }}
                           />
                           <Area type="monotone" dataKey="revenue" stroke="#0A2E1F" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>

               {/* Quick Referral Engine */}
               <div className="lg:col-span-4 space-y-8">
                  <Card className="bg-[#D4AF37] text-[#0A2E1F] border-none rounded-[3rem] shadow-[0_20px_50px_rgba(212,175,55,0.3)] p-10 relative overflow-hidden h-full">
                     <div className="absolute bottom-0 right-0 opacity-10 -mr-10 -mb-10">
                        <Share2 size={240} strokeWidth={0.5} />
                     </div>
                     <div className="relative z-10 space-y-6">
                        <div className="h-14 w-14 rounded-2xl bg-[#0A2E1F]/10 flex items-center justify-center">
                           <Sparkles className="h-7 w-7" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter leading-none">Instant Share Control</h3>
                        <p className="text-sm font-bold opacity-70 leading-relaxed italic">
                          "Your top performing link this week is GLP-1 Weight Loss protocol. High conversion detected."
                        </p>
                        
                        <div className="space-y-3 pt-4">
                           <div className="bg-[#0A2E1F]/5 border border-[#0A2E1F]/10 rounded-2xl p-4 flex items-center justify-between">
                              <span className="text-xs font-mono font-black truncate mr-4 italic">peak-health.io?ref=ELITE-1</span>
                              <button onClick={copyRefLink} className="shrink-0 hover:scale-110 transition-transform">
                                 {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                              </button>
                           </div>
                           <Button className="w-full h-14 rounded-2xl bg-[#0A2E1F] text-white font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-transform">
                             Share Assets →
                           </Button>
                        </div>
                     </div>
                  </Card>
               </div>
            </div>

            {/* ── MILESTONES & LEADERS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               
               {/* Referral Activity Ledger */}
               <Card className="lg:col-span-7 border-none shadow-xl shadow-slate-200/30 rounded-[3rem] overflow-hidden">
                  <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                     <CardTitle className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-widest flex items-center gap-2">
                       <Activity className="h-4 w-4 text-emerald-600" /> Live Referral Feed
                     </CardTitle>
                     <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Export Ledger</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                     <div className="divide-y divide-slate-50">
                        {[
                          { patient: "E.O.", time: "2m ago", product: "GLP-1 Program", commission: "$42.50", status: "Active" },
                          { patient: "J.D.", time: "14m ago", product: "Hair Restore", commission: "$18.00", status: "Processing" },
                          { patient: "A.L.", time: "1h ago", product: "Bio-Optimizer", commission: "$24.00", status: "Active" },
                          { patient: "S.K.", time: "3h ago", product: "Longevity Pack", commission: "$35.00", status: "Active" },
                        ].map((row, i) => (
                          <div key={i} className="p-8 hover:bg-slate-50 transition-all flex items-center justify-between group">
                             <div className="flex items-center gap-6">
                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-[#0A2E1F] group-hover:bg-[#0A2E1F] group-hover:text-white transition-colors">
                                   {row.patient}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-[#0A2E1F]">{row.product}</p>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{row.time}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-black text-emerald-600">{row.commission}</p>
                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                   <div className={cn("h-1.5 w-1.5 rounded-full", row.status === 'Active' ? "bg-emerald-500" : "bg-amber-500")} />
                                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{row.status}</span>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>

               {/* Growth Roadmap */}
               <Card className="lg:col-span-5 bg-slate-50 border-none rounded-[3rem] p-10 flex flex-col justify-between">
                  <div className="space-y-6">
                     <div className="h-14 w-14 rounded-2xl bg-[#0A2E1F] flex items-center justify-center">
                        <Trophy className="h-7 w-7 text-[#D4AF37]" />
                     </div>
                     <h3 className="text-3xl font-black tracking-tight text-[#0A2E1F]">Partner Roadmap</h3>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">
                       "You are **$12,400 away** from unlocking the **Platinum Tier (25%)** and your first luxury gift box."
                     </p>
                  </div>
                  
                  <div className="space-y-8 mt-10">
                     {[
                       { label: "Silver Partner", status: "Achieved", progress: 100, active: false },
                       { label: "Gold Partner", status: "Achieved", progress: 100, active: false },
                       { label: "Emerald Partner", status: "Current Tier", progress: 60, active: true },
                       { label: "Platinum Elite", status: "Locked", progress: 0, active: false },
                     ].map((tier, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                             <span className={cn("text-[10px] font-black uppercase tracking-widest", tier.active ? "text-emerald-600" : "text-slate-400")}>
                               {tier.label}
                             </span>
                             <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{tier.status}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white rounded-full overflow-hidden shadow-inner">
                             <div 
                               className={cn("h-full transition-all duration-1000", tier.active ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-slate-200")} 
                               style={{ width: `${tier.progress}%` }}
                             />
                          </div>
                       </div>
                     ))}
                  </div>
               </Card>

            </div>

          </motion.div>
        )}

        {activeTab === 'referrals' && (
           <motion.div 
             key="referrals"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="min-h-[500px] flex flex-col items-center justify-center text-center py-20"
           >
              <div className="h-24 w-24 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
                 <Users className="h-10 w-10 text-slate-200" />
              </div>
              <h2 className="text-3xl font-black text-[#0A2E1F] tracking-tighter uppercase italic">Full Ledger <span className="text-emerald-600 font-serif italic font-normal lowercase">coming soon</span></h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-4 max-w-sm leading-loose">
                We are synchronizing your historical patient data for a high-fidelity audit experience.
              </p>
           </motion.div>
        )}

        {activeTab === 'payouts' && (
           <motion.div 
             key="payouts"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-8"
           >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <Card className="p-10 border-none shadow-xl shadow-slate-200/40 rounded-[3rem] bg-[#0A2E1F] text-white">
                    <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mb-2">Next Scheduled Payout</p>
                    <h3 className="text-3xl font-black tracking-tight">May 31, 2026</h3>
                    <div className="mt-8 flex items-center gap-2">
                       <Clock className="h-4 w-4 text-[#D4AF37]" />
                       <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Processing in 17 Days</span>
                    </div>
                 </Card>
                 <Card className="p-10 border-none shadow-xl shadow-slate-200/40 rounded-[3rem] bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Paid to Date</p>
                    <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tight">$42,800.00</h3>
                    <div className="mt-8 flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Account</span>
                    </div>
                 </Card>
                 <Card className="p-10 border-none shadow-xl shadow-slate-200/40 rounded-[3rem] bg-emerald-50/50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Payment Method</p>
                    <h3 className="text-xl font-black text-[#0A2E1F] tracking-tight truncate">Stripe •••• 4242</h3>
                    <Button variant="link" className="mt-4 p-0 h-auto text-[9px] font-black text-emerald-600 uppercase tracking-widest">Update Details →</Button>
                 </Card>
              </div>

              <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[3rem] overflow-hidden">
                 <CardHeader className="p-10 border-b border-slate-50">
                    <CardTitle className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-widest">Financial History</CardTitle>
                 </CardHeader>
                 <CardContent className="p-20 text-center flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                       <Receipt className="h-10 w-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">No historical payouts found for 2026 Q1</p>
                 </CardContent>
              </Card>
           </motion.div>
        )}

        {activeTab === 'assets' && (
           <motion.div 
             key="assets"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
           >
              {[
                { title: "Primary Brand Logo", type: "Vector / PNG", size: "12MB", icon: ImageIcon },
                { title: "GLP-1 Social Story", type: "MP4 / High Res", size: "45MB", icon: Sparkles },
                { title: "Hair Restore Banner", type: "JPG / Display", size: "8MB", icon: ImageIcon },
                { title: "Affiliate Guide PDF", type: "Document", size: "2MB", icon: FileText },
                { title: "Peak Health Color Palette", type: "Design Asset", size: "1MB", icon: Sparkles },
                { title: "Email Outreach Script", type: "Copywriting", size: "12KB", icon: MessageSquare },
              ].map((asset, i) => (
                <Card key={i} className="group border-none shadow-xl shadow-slate-200/30 rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-all">
                   <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                      <asset.icon className="h-12 w-12 text-slate-200 group-hover:text-emerald-600 transition-colors" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                   </div>
                   <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-4">
                         <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest border-slate-100 text-slate-400">{asset.type}</Badge>
                         <span className="text-[9px] font-bold text-slate-300">{asset.size}</span>
                      </div>
                      <h3 className="text-lg font-black text-[#0A2E1F] tracking-tight mb-6">{asset.title}</h3>
                      <Button className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 text-[#0A2E1F] hover:bg-[#0A2E1F] hover:text-white transition-all font-black uppercase text-[9px] tracking-widest gap-2">
                         Download Asset <Download className="h-3.5 w-3.5" />
                      </Button>
                   </CardContent>
                </Card>
              ))}
           </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECURITY FOOTER ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 rounded-[3rem] bg-[#0A2E1F] text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <Globe className="absolute -bottom-20 -left-20 h-96 w-96" />
         </div>
         <div className="flex items-center gap-6 relative z-10">
            <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
               <ShieldCheck size={32} className="text-[#D4AF37]" />
            </div>
            <div>
               <p className="text-xs font-black uppercase tracking-[0.3em]">Institutional Grade Security</p>
               <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mt-1">All financial data is AES-256 Encrypted & HIPAA compliant</p>
            </div>
         </div>
         <div className="flex items-center gap-8 relative z-10">
            <div className="text-right hidden sm:block">
               <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Affiliate Portal v2.0</p>
               <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Network Status: Optimized</p>
            </div>
            <Lock size={20} className="text-emerald-400" />
         </div>
      </div>

    </div>
  );
}
