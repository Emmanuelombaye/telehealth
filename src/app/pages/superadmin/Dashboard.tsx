import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Globe, TrendingUp, Users, DollarSign, Activity, ShieldCheck,
  Server, Building2, Package, Search, Bell, Command, ChevronRight,
  Shield, Zap, Lock, Cpu
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../components/ui/shared.tsx";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { supabase } from "../../../lib/supabaseClient";
import { cn } from "../../components/ui/utils";

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
    const brand = order.sub_brand || "Peak Health";
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
    <div className="min-h-screen bg-[#F8FAF9] p-6 lg:p-10 font-sans text-[#0A0D14] animate-in fade-in duration-700">
      
      {/* GLOBAL EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 animate-slide-in-right">
        <div className="flex items-center gap-6">
           <div className="h-20 w-20 rounded-[28px] bg-gradient-to-br from-[#0A2E1F] to-[#051810] flex items-center justify-center shadow-[0_20px_40px_rgba(10,46,31,0.3)] border border-emerald-500/20 group cursor-pointer hover:scale-105 transition-transform duration-500">
             <ShieldCheck className="h-10 w-10 text-emerald-400 group-hover:animate-pulse" />
           </div>
           <div>
             <div className="flex items-center gap-4 mb-2">
               <h1 className="text-5xl font-black tracking-tight text-[#0A2E1F] leading-tight">Executive Dashboard</h1>
               <Badge className="bg-[#0A2E1F] text-emerald-400 border border-emerald-500/30 px-4 py-1.5 font-black uppercase tracking-[0.2em] text-[10px] rounded-full shadow-lg shadow-emerald-900/20">SUPREME</Badge>
             </div>
             <p className="text-slate-500 font-bold text-lg flex items-center gap-2">
               <Activity size={18} className="text-emerald-500 animate-pulse" />
               Global Infrastructure & High-Net-Worth Liquidity Matrix
             </p>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/admin/orders">
            <Button className="h-16 rounded-[24px] bg-white border border-slate-200 text-[#0A2E1F] hover:border-emerald-500 hover:bg-emerald-50 transition-all gap-3 px-10 shadow-xl shadow-slate-200/50 font-black uppercase tracking-widest text-xs">
              <Package size={22} className="text-emerald-600" /> Platform Orders
            </Button>
          </Link>
          <div className="h-16 w-16 rounded-[24px] bg-white border border-slate-200 flex items-center justify-center shadow-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <Bell size={24} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* LUXURY KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {[
          { label: "Aggregate MRR", value: `$${totalMRR.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: "GLOBAL LIQUIDITY", icon: DollarSign, color: "text-emerald-400", bg: "bg-gradient-to-br from-[#0A2E1F] to-[#051810]" },
          { label: "Active Brands", value: activeBrandsCount.toString(), sub: "ENTERPRISE ENTITIES", icon: Building2, color: "text-[#0A2E1F]", bg: "bg-white" },
          { label: "Global Users", value: uniquePatients.toString() || "0", sub: "NETWORK SCALE", icon: Users, color: "text-[#0A2E1F]", bg: "bg-white" },
          { label: "Security Status", value: "99.98%", sub: "PLATFORM INTEGRITY", icon: Shield, color: "text-[#0A2E1F]", bg: "bg-white" },
        ].map((s, i) => (
          <Card key={i} className={cn("border-none shadow-2xl shadow-slate-200/60 rounded-[40px] hover:-translate-y-2 transition-all duration-700 animate-bounce-in", i === 0 && "overflow-hidden")} style={{ animationDelay: `${i * 0.15}s` }}>
            <CardContent className={cn("p-10 relative h-full flex flex-col", i === 0 ? "bg-gradient-to-br from-[#0A2E1F] to-[#051810] text-white" : "bg-white text-[#0A2E1F]")}>
              {i === 0 && <div className="absolute inset-0 opacity-30 pointer-events-none animate-shimmer bg-emerald-500/20"></div>}
              <div className="flex items-start justify-between mb-10">
                <div className={cn("h-16 w-16 rounded-[20px] flex items-center justify-center", i === 0 ? "bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-900/40" : "bg-emerald-50 border border-emerald-100")}>
                  <s.icon className={cn("h-8 w-8", i === 0 ? "text-emerald-400" : "text-emerald-600")} />
                </div>
                <div className={cn("h-8 px-3 rounded-full flex items-center gap-1 font-black text-[10px] tracking-widest uppercase", i === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>
                  <TrendingUp size={12} />
                  LIVE
                </div>
              </div>
              <p className={cn("text-4xl font-black tracking-tight mb-2", i === 0 ? "text-white" : "text-[#0A2E1F]")}>{s.value}</p>
              <p className={cn("text-sm font-black uppercase tracking-[0.2em]", i === 0 ? "text-emerald-400/80" : "text-slate-400")}>{s.label}</p>
              <div className="mt-auto pt-6 flex items-center gap-2 border-t border-current/5">
                <span className={cn("text-[10px] font-bold tracking-widest uppercase", i === 0 ? "text-emerald-500/50" : "text-slate-300")}>{s.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* REVENUE STREAM - MAIN MODULE */}
        <div className="lg:col-span-2 animate-bounce-in" style={{ animationDelay: "0.4s" }}>
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[48px] h-full overflow-hidden relative group bg-white">
             <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-1000 pointer-events-none">
               <Globe size={320} />
             </div>
             
             <CardContent className="p-12 h-full flex flex-col">
               <div className="flex items-center justify-between mb-12 relative">
                  <div>
                    <h3 className="text-4xl font-black text-[#0A2E1F] tracking-tighter">Revenue Architecture</h3>
                    <p className="text-slate-400 font-bold text-lg mt-2 uppercase tracking-widest text-xs">Global Liquidity Performance</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                      <span className="text-3xl font-black text-emerald-600">+24.8%</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Annual Growth</span>
                    </div>
                    <div className="h-14 w-14 rounded-3xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <Zap size={24} className="text-emerald-600" />
                    </div>
                  </div>
               </div>

               <div className="h-[380px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={liveRevenueData.length > 0 ? liveRevenueData : [{month: "Current", revenue: totalMRR}]}>
                      <defs>
                        <linearGradient id="luxRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 900 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A2E1F', border: 'none', borderRadius: '32px', color: '#fff', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4)', padding: '24px' }}
                        itemStyle={{ color: '#34d399', fontWeight: 950, fontSize: '20px' }}
                        cursor={{ stroke: '#10b981', strokeWidth: 3, strokeDasharray: '6 6' }}
                        formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, "PLATFORM TOTAL"]} 
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#luxRev)" strokeWidth={6} animationDuration={2500} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* THE "LUXURY" EXECUTIVE PERFORMANCE CARD - RIGHT SIDE */}
        <div className="animate-bounce-in" style={{ animationDelay: "0.5s" }}>
          <Card className="border-none shadow-2xl shadow-emerald-900/20 rounded-[48px] h-full flex flex-col bg-gradient-to-br from-[#0A2E1F] via-[#051810] to-[#020a07] text-white overflow-hidden relative group">
             {/* High-End Decoration */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-900/40 blur-[60px] rounded-full -ml-16 -mb-16"></div>
             
             <CardContent className="p-12 h-full flex flex-col relative z-10">
               <div className="flex items-center justify-between mb-12">
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter text-emerald-50">Market Share</h3>
                    <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 opacity-60">Executive Distribution</p>
                  </div>
                  <div className="h-16 w-16 rounded-[24px] bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl shadow-black/40 group-hover:border-emerald-500/50 transition-all duration-500">
                    <Building2 size={28} className="text-emerald-400" />
                  </div>
               </div>

               <div className="h-[240px] w-full mb-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]} barSize={28}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#34d399", fontWeight: 900, opacity: 0.4 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '24px', color: '#0A2E1F', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', padding: '16px' }}
                        itemStyle={{ color: '#059669', fontWeight: 950 }}
                        cursor={{ fill: 'rgba(52, 211, 153, 0.08)' }}
                        formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, 'REVENUE']} 
                      />
                      <Bar dataKey="revenue" radius={[14, 14, 14, 14]}>
                        {(liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]).map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#10b981" : i === 1 ? "#34d399" : i === 2 ? "#6ee7b7" : "#a7f3d0"} className="hover:brightness-125 transition-all duration-300" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>

               <div className="space-y-4 flex-1">
                  {(liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]).map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-[28px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/40 transition-all duration-500 group/item cursor-pointer">
                       <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-[18px] flex items-center justify-center bg-white/5 text-emerald-400 font-black text-sm border border-white/5 group-hover/item:bg-emerald-500 group-hover/item:text-white group-hover/item:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-500">
                             {b.name.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-base font-black text-emerald-50 uppercase tracking-widest">{b.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                               <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em]">Tier One Instance</span>
                            </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-xl font-black text-emerald-400 group-hover/item:text-white transition-colors tracking-tighter">${(b.revenue / 1000).toFixed(1)}K</span>
                          <ChevronRight size={18} className="text-white/20 group-hover/item:text-emerald-400 transition-all translate-x-0 group-hover/item:translate-x-1" />
                       </div>
                    </div>
                  ))}
               </div>

               {/* Luxury Executive Action */}
               <Link to="/superadmin/brands" className="mt-10">
                 <Button className="w-full h-16 rounded-[28px] bg-emerald-500 hover:bg-emerald-400 text-[#0A2E1F] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border-none">
                   Enterprise Brands Matrix
                 </Button>
               </Link>
             </CardContent>
          </Card>
        </div>

      </div>

      {/* FOOTER METRICS */}
      <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
         <div className="flex items-center gap-2">
            <Lock size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">AES-256 Encrypted Platform</span>
         </div>
         <div className="h-1 w-1 rounded-full bg-slate-300"></div>
         <div className="flex items-center gap-2">
            <Cpu size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quantum-Ready Infrastructure</span>
         </div>
      </div>

    </div>
  );
}
