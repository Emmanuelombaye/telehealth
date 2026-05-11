import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Globe, TrendingUp, Users, DollarSign, Activity, ShieldCheck,
  Server, Building2, Package, Search, Bell, Command, ChevronRight,
  Shield, Zap, Lock, Globe2, ArrowUpRight, Radar,
  Fingerprint, Sparkles, Rocket
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../components/ui/shared.tsx";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { supabase } from "../../../lib/supabaseClient";
import { cn } from "../../components/ui/utils";
import { motion, AnimatePresence } from "framer-motion";

export function SuperAdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalMRR = orders.reduce((sum, order) => {
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    return sum + amt;
  }, 0);

  const uniquePatients = new Set(orders.map(o => o.patient_name)).size;

  const liveBrandRevenueObj = orders.reduce((acc, order) => {
    const brand = order.subBrand || order.sub_brand || "Peak Health";
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    if (!acc[brand]) acc[brand] = { name: brand, revenue: 0 };
    acc[brand].revenue += amt;
    return acc;
  }, {} as Record<string, { name: string, revenue: number }>);
  
  const liveBrandRevenue = (Object.values(liveBrandRevenueObj) as { name: string, revenue: number }[]).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  const activeBrandsCount = Object.keys(liveBrandRevenueObj).length || 1;

  const liveRevenueData = (Object.values(orders.reduce((acc, order) => {
     const date = new Date(order.created_at || new Date());
     const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
     const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
     if (!acc[monthYear]) acc[monthYear] = { month: monthYear, revenue: 0, dateObj: date };
     acc[monthYear].revenue += amt;
     return acc;
  }, {} as Record<string, { month: string, revenue: number, dateObj: Date }>)) as { month: string, revenue: number, dateObj: Date }[])
  .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
  .map(item => ({ month: item.month, revenue: item.revenue }));

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-10 font-sans text-[#0A0D14] animate-in fade-in duration-700">
      
      {/* ELITE COCKPIT HEADER */}
      <div className="bg-white p-8 lg:p-12 rounded-[56px] shadow-2xl shadow-slate-200/50 border border-slate-50 mb-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[120px] -mr-64 -mt-64 opacity-60 group-hover:opacity-80 transition-opacity duration-1000"></div>
        
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12">
           <div className="flex items-center gap-10">
              <div className="h-28 w-28 rounded-[40px] bg-[#0A2E1F] flex items-center justify-center shadow-3xl shadow-emerald-900/40 border border-emerald-400/20 group cursor-pointer hover:rotate-6 transition-all duration-700 shrink-0">
                <ShieldCheck className="h-14 w-14 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                 <div className="flex items-center gap-4 mb-3">
                    <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-1.5 font-black uppercase tracking-[0.3em] text-[9px] rounded-full">SUPREME AUTHORITY</Badge>
                    <div className="flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Infrastructure: Live</span>
                    </div>
                 </div>
                 <h1 className="text-6xl font-black tracking-tight text-[#0A2E1F] leading-none mb-6">Command Hub</h1>
                 
                 <div className="flex flex-wrap items-center gap-10 pt-6 border-t border-slate-50">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Infrastructure Status</p>
                       <p className="text-lg font-black text-[#0A2E1F] flex items-center gap-2">
                          <Activity size={18} className="text-emerald-500" /> OPTIMAL
                       </p>
                    </div>
                    <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Global Active Nodes</p>
                       <p className="text-lg font-black text-[#0A2E1F] flex items-center gap-2 uppercase tracking-tight">
                          <Globe2 size={18} className="text-blue-500" /> US, EU, APAC
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
              <Link to="/superadmin/security" className="w-full sm:w-auto">
                <Button className="w-full h-20 rounded-[32px] bg-white border border-slate-100 text-[#0A2E1F] hover:border-emerald-500 hover:bg-emerald-50 transition-all gap-5 px-12 shadow-xl shadow-slate-200/50 font-black uppercase tracking-[0.2em] text-[11px]">
                   <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Lock size={20} />
                   </div>
                   Advanced Security
                </Button>
              </Link>
              <div className="h-20 w-20 rounded-[32px] bg-white border border-slate-100 flex items-center justify-center shadow-xl cursor-pointer hover:bg-slate-50 transition-all hover:-translate-y-1 group">
                 <Bell size={28} className="text-slate-400 group-hover:text-[#0A2E1F] transition-colors" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-10">
        
        {/* MAIN COMMAND SECTION (LHS + MIDDLE) */}
        <div className="lg:col-span-3 space-y-10">
           
           {/* LUXURY KPI CARDS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Aggregate MRR", value: `$${totalMRR.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Enterprise Entities", value: activeBrandsCount.toString(), icon: Building2, color: "text-[#0A2E1F]", bg: "bg-slate-50" },
                { label: "Global Network Scale", value: uniquePatients.toLocaleString(), icon: Users, color: "text-emerald-700", bg: "bg-emerald-50/50" }
              ].map((s, i) => (
                <Card key={i} className="border-none shadow-2xl shadow-slate-100/50 rounded-[48px] overflow-hidden bg-white p-10 flex flex-col items-center text-center group hover:shadow-emerald-900/5 transition-all duration-500">
                   <div className={cn("h-20 w-20 rounded-[32px] mb-8 flex items-center justify-center group-hover:scale-110 transition-transform", s.bg, s.color)}>
                      <s.icon className="h-10 w-10" />
                   </div>
                   <h2 className="text-5xl font-black tracking-tighter text-[#0A2E1F] mb-1">{s.value}</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{s.label}</p>
                </Card>
              ))}
           </div>

           {/* REVENUE ARCHITECTURE CHART */}
           <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[64px] overflow-hidden bg-white relative group">
              <div className="p-16">
                 <div className="flex items-center justify-between mb-16">
                    <div>
                       <h3 className="text-4xl font-black text-[#0A2E1F] tracking-tighter">Global Liquidity Matrix</h3>
                       <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[11px] mt-2">Real-time Financial Flow Architecture</p>
                    </div>
                    <div className="h-16 w-16 rounded-[28px] bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                       <Zap size={28} className="animate-pulse" />
                    </div>
                 </div>
                 <div className="h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={liveRevenueData.length > 0 ? liveRevenueData : [{month: "Current", revenue: totalMRR}]}>
                        <defs>
                          <linearGradient id="execRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#cbd5e1", fontWeight: 900 }} />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0A2E1F', border: 'none', borderRadius: '32px', color: '#fff', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', padding: '32px' }}
                          itemStyle={{ color: '#10b981', fontWeight: 950, fontSize: '24px' }}
                          formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, "GLOBAL VOLUME"]} 
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#execRev)" strokeWidth={8} />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </Card>
        </div>

        {/* THE "EXECUTIVE EMERALD" RIGHT COMMAND STRIP */}
        <div className="lg:col-span-1 space-y-10">
           
           {/* PLATFORM PULSE CARD */}
           <Card className="border-none shadow-3xl shadow-emerald-900/25 rounded-[56px] bg-gradient-to-br from-[#0A2E1F] via-[#051810] to-[#020a07] text-white p-12 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/30 transition-all duration-1000"></div>
              <div className="relative z-10 space-y-10">
                 <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black tracking-tight text-emerald-50">Pulse Core</h3>
                    <Radar className="h-7 w-7 text-emerald-400 animate-spin-slow" />
                 </div>
                 <div className="space-y-6">
                    {[
                      { label: "Server Latency", val: "14ms", status: "emerald" },
                      { label: "Database Load", val: "22%", status: "emerald" },
                      { label: "Active Threats", val: "0", status: "slate" },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-5 rounded-[24px] bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100/50">{m.label}</span>
                         <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-white">{m.val}</span>
                            <div className={cn("h-2 w-2 rounded-full", m.status === 'emerald' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)]' : 'bg-slate-500')} />
                         </div>
                      </div>
                    ))}
                 </div>
                 <Button className="w-full h-16 rounded-[24px] bg-emerald-500 hover:bg-emerald-400 text-[#0A2E1F] font-black uppercase tracking-[0.3em] text-[11px] border-none transition-all hover:scale-[1.02]">
                    Full System Audit
                 </Button>
              </div>
           </Card>

           {/* LIQUIDITY FLOW CARD */}
           <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[56px] bg-white p-12 space-y-10 group transition-all hover:border-emerald-500 border border-transparent">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-black tracking-tight text-[#0A2E1F]">Flow Matrix</h3>
                 <div className="h-12 w-12 rounded-[20px] bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <TrendingUp size={24} />
                 </div>
              </div>
              <div className="space-y-8">
                 {liveBrandRevenue.map((b, i) => (
                   <div key={i} className="space-y-4">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                         <span className="text-slate-400">{b.name}</span>
                         <span className="text-[#0A2E1F]">${(b.revenue / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(b.revenue / (totalMRR || 1)) * 100}%` }}
                           transition={{ duration: 1.5, delay: i * 0.2 }}
                           className="h-full bg-emerald-600 rounded-full"
                         />
                      </div>
                   </div>
                 ))}
              </div>
              <Link to="/superadmin/finance">
                <Button variant="outline" className="w-full h-16 rounded-[24px] border-slate-100 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  Full Finance Matrix
                </Button>
              </Link>
           </Card>

        </div>
      </div>

      {/* GLOBAL FOOTER SIGNATURE */}
      <div className="mt-24 pt-12 border-t border-slate-100 flex items-center justify-between opacity-30">
         <div className="flex items-center gap-8">
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">AES-256 Vault-Active</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Peak Health Supreme Authority</span>
         </div>
         <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] mb-2">it's about you.</p>
         </div>
      </div>

    </div>
  );
}
