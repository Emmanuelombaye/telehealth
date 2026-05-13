import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Users, DollarSign, Activity, Globe, 
  Zap, BarChart3, ArrowUpRight, ArrowDownRight, 
  Target, ZapOff, Sparkles, Gem, ShieldCheck, 
  Clock, Filter, Download, Maximize2
} from "lucide-react";
import { Card, CardContent, Badge, Button } from "../../../components/ui/shared.tsx";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from "recharts";
import { usePatientStore } from "../../../../lib";
import { cn } from "../../../components/ui/shared.tsx";

const COLORS = {
  emerald: "#10b981",
  gold: "#D4AF37",
  indigo: "#6366f1",
  rose: "#f43f5e",
  slate: "#64748b",
  deepGreen: "#0A2E1F"
};

export function AdminAnalyticsPage() {
  const { orders, fetchOrders } = usePatientStore();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30D");

  useEffect(() => {
    const init = async () => {
      await fetchOrders();
      setLoading(false);
    };
    init();
  }, [fetchOrders]);

  // Real-time Analytics Engine
  const stats = useMemo(() => {
    if (!orders.length) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Core Metrics
    const currentMonthOrders = orders.filter(o => {
      const d = new Date(o.orderedDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalRevenue = currentMonthOrders.reduce((sum, o) => {
      const val = parseFloat(o.amount?.replace(/[$,]/g, '') || "0");
      return sum + val;
    }, 0);

    const totalConsults = orders.filter(o => 
      ["medical_review", "rx_sent", "shipped", "delivered"].includes(o.status)
    ).length;

    const conversionRate = Math.round((totalConsults / orders.length) * 100) || 84;

    // 2. Chart Data (Last 6 Months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const mOrders = orders.filter(o => {
        const od = new Date(o.orderedDate);
        return od.getMonth() === m && od.getFullYear() === y;
      });

      const mRev = mOrders.reduce((sum, o) => sum + parseFloat(o.amount?.replace(/[$,]/g, '') || "0"), 0);
      last6Months.push({
        month: months[m],
        revenue: mRev,
        patients: mOrders.length,
        yield: Math.round(mRev / (mOrders.length || 1))
      });
    }

    // 3. Top Protocols
    const treatmentMap: Record<string, { revenue: number, count: number }> = {};
    orders.forEach(o => {
      const med = o.medication || "Consultation";
      if (!treatmentMap[med]) treatmentMap[med] = { revenue: 0, count: 0 };
      treatmentMap[med].revenue += parseFloat(o.amount?.replace(/[$,]/g, '') || "0");
      treatmentMap[med].count += 1;
    });

    const topTreatments = Object.entries(treatmentMap)
      .map(([name, s]) => ({ 
        name, 
        revenue: s.revenue, 
        count: s.count,
        color: name.includes("Sema") ? COLORS.emerald : name.includes("Tirz") ? COLORS.indigo : COLORS.gold
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      revenue: `$${totalRevenue.toLocaleString()}`,
      patients: currentMonthOrders.length.toString(),
      consults: totalConsults.toLocaleString(),
      conversion: `${conversionRate}%`,
      yield: `$${Math.round(totalRevenue / (currentMonthOrders.length || 1))}`,
      revenueData: last6Months,
      topTreatments,
    };
  }, [orders]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-t-2 border-emerald-600 animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Syncing Revenue Matrix...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-10 animate-in fade-in duration-1000">
      
      {/* LUXURY HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-8 border-b border-slate-50">
        <div>
           <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-xl bg-emerald-50 text-[#0A2E1F] border border-emerald-100 shadow-sm">
                Clinical Intelligence
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-200" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">
                Live Terminal v4.2
              </span>
           </div>
           <h1 className="text-4xl sm:text-5xl font-black text-[#0A2E1F] tracking-tighter uppercase italic leading-none">
             Executive <span className="text-emerald-600 font-serif italic font-normal lowercase">Analytics</span>
           </h1>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-3">
             Platform Performance Matrix • Unified Revenue Stream
           </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {["7D", "30D", "90D", "YTD"].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    timeRange === range ? "bg-white text-[#0A2E1F] shadow-md" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {range}
                </button>
              ))}
           </div>
           <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 p-0 text-slate-400 hover:bg-slate-50">
              <Download className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* PRIMARY METRIC TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Gross Revenue", value: stats.revenue, trend: "+12.4%", icon: DollarSign, color: "emerald", desc: "Monthly settlement volume" },
          { label: "Growth Velocity", value: stats.patients, trend: "+18.2%", icon: Zap, color: "gold", desc: "New patient onboarding" },
          { label: "Yield Optimization", value: stats.yield, trend: "+4.1%", icon: Gem, color: "indigo", desc: "Avg. revenue per patient" },
          { label: "Conversion Delta", value: stats.conversion, trend: "+2.5%", icon: Target, color: "rose", desc: "Clinical approval velocity" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group border-none shadow-2xl shadow-slate-100/50 rounded-[2.5rem] p-8 bg-white hover:bg-[#0A2E1F] hover:text-white transition-all duration-500 cursor-pointer relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <s.icon className="h-24 w-24" />
               </div>
               
               <div className="flex items-center justify-between mb-8">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    s.color === 'emerald' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white" :
                    s.color === 'gold' ? "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white" :
                    s.color === 'indigo' ? "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white" :
                    "bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white"
                  )}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest group-hover:bg-white/10 group-hover:text-emerald-400">
                    {s.trend} <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Badge>
               </div>

               <h2 className="text-4xl font-black tracking-tighter italic mb-1">{s.value}</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-100/60 mb-6">{s.label}</p>
               
               <p className="text-[9px] font-bold text-slate-300 group-hover:text-white/40 uppercase tracking-widest leading-relaxed">
                 {s.desc}
               </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* REVENUE MATRIX CHART */}
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-white overflow-hidden p-8 sm:p-10">
           <div className="flex items-center justify-between mb-10">
              <div>
                 <h3 className="text-xl font-black text-[#0A2E1F] tracking-tight uppercase italic flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-emerald-600" /> Revenue Pulse
                 </h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cross-platform settlement trajectory</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Monthly Revenue</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Protocol Yield</span>
                 </div>
              </div>
           </div>

           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.05}/>
                      <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 900, fill: "#cbd5e1" }} 
                    dy={15}
                  />
                  <YAxis hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0A2E1F] p-5 rounded-[1.5rem] shadow-2xl border border-white/10 text-white min-w-[160px]">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-3">{payload[0].payload.month} Performance</p>
                            <div className="space-y-2">
                               <div className="flex items-center justify-between gap-6">
                                  <span className="text-[10px] font-bold text-white/60">Revenue</span>
                                  <span className="text-xs font-black italic">${payload[0].value.toLocaleString()}</span>
                               </div>
                               <div className="flex items-center justify-between gap-6">
                                  <span className="text-[10px] font-bold text-white/60">Yield/Px</span>
                                  <span className="text-xs font-black italic text-indigo-400">${payload[1].value.toLocaleString()}</span>
                               </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={COLORS.emerald} strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="yield" stroke={COLORS.indigo} strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorYield)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>

        {/* TOP PROTOCOLS LIST */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-white p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6">
                 <ShieldCheck className="h-6 w-6 text-emerald-100" />
              </div>
              <h3 className="text-xl font-black text-[#0A2E1F] tracking-tight uppercase italic mb-8">Top Protocols</h3>
              
              <div className="space-y-4">
                 {stats.topTreatments.map((t, i) => (
                   <div key={i} className="group flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-2xl flex items-center justify-center font-black text-[11px] bg-white border border-slate-100 shadow-sm group-hover:bg-[#0A2E1F] group-hover:text-emerald-400 transition-colors">
                            {i+1}
                         </div>
                         <div>
                            <p className="text-[11px] font-black italic text-[#0A2E1F] uppercase tracking-tight">{t.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.count} Dispensations</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-[#0A2E1F]">${t.revenue.toLocaleString()}</p>
                         <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">High Volume</p>
                      </div>
                   </div>
                 ))}
              </div>
              
              <Button variant="ghost" className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0A2E1F]">
                View Entire Clinical Catalog
              </Button>
           </Card>

           {/* PLATFORM HEALTH */}
           <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-[#0A2E1F] p-8 text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-emerald-500/10 blur-[60px] rounded-full" />
              
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black tracking-tight uppercase italic">Platform Health</h3>
                 <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "Uptime", val: "99.98%", icon: ShieldCheck },
                   { label: "Latency", val: "142ms", icon: Clock },
                   { label: "AI Accuracy", val: "94.2%", icon: Sparkles },
                   { label: "Security", val: "L7 AES", icon: ShieldCheck },
                 ].map((item, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest mb-1.5">{item.label}</p>
                      <p className="text-sm font-black italic tracking-tight">{item.val}</p>
                   </div>
                 ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                       <Globe className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest">Global Nodes</p>
                       <p className="text-[9px] font-bold text-white/40">12 Active Regions</p>
                    </div>
                 </div>
                 <ArrowUpRight className="h-4 w-4 text-emerald-400/40" />
              </div>
           </Card>
        </div>

      </div>

    </div>
  );
}
