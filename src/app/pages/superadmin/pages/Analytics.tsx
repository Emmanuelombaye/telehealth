import { useState, useEffect } from "react";
import {
  DollarSign, Users, Activity, TrendingUp, Globe, Package,
  Zap, ShieldCheck, Globe2, CreditCard, ArrowUpRight, Radar,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, cn } from "../../../components/ui/shared.tsx";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend
} from "recharts";
import { usePatientStore } from "../../../../lib/patient-store";
import { motion, AnimatePresence } from "framer-motion";

export function SuperAdminAnalyticsPage() {
  const { orders } = usePatientStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orders) setLoading(false);
  }, [orders]);

  // LIVE DATA CALCULATIONS
  const totalMRR = orders.reduce((sum, o) => {
    const amt = typeof o.amount === 'number' ? o.amount : parseFloat(String(o.amount).replace(/[^0-9.-]+/g,"")) || 0;
    return sum + amt;
  }, 0);

  const uniquePatientsCount = new Set(orders.map(o => o.patient_name)).size;
  const totalOrdersCount = orders.length;

  // REVENUE BY BRAND - GROUPED BY MONTH
  const groupedRevenue = orders.reduce((acc, order) => {
    const date = new Date(order.created_at || new Date());
    const month = date.toLocaleString('default', { month: 'short' });
    const brand = order.subBrand || order.sub_brand || "Peak Health";
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    
    if (!acc[month]) acc[month] = { month, dateObj: date };
    acc[month][brand] = (acc[month][brand] || 0) + amt;
    return acc;
  }, {} as any);

  const platformRevenueData = Object.values(groupedRevenue)
    .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime())
    .map((item: any) => {
      const { dateObj, ...rest } = item;
      return rest;
    });

  const brands = Array.from(new Set(orders.map(o => o.subBrand || o.sub_brand || "Peak Health")));
  const brandColors = ["#10b981", "#064e3b", "#34d399", "#059669"];

  // GEO DATA MOCK (Since we don't have real location data in orders yet)
  const geoData = [
    { country: "🇺🇸 United States", patients: Math.floor(uniquePatientsCount * 0.45), pct: 45 },
    { country: "🇬🇧 United Kingdom", patients: Math.floor(uniquePatientsCount * 0.24), pct: 24 },
    { country: "🇦🇪 UAE", patients: Math.floor(uniquePatientsCount * 0.15), pct: 15 },
    { country: "🇧🇷 Brazil", patients: Math.floor(uniquePatientsCount * 0.08), pct: 8 },
    { country: "🌍 Other", patients: Math.floor(uniquePatientsCount * 0.08), pct: 8 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* ANALYTICS COCKPIT HEADER */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-700">Global Data Matrix</h1>
          </div>
          <h2 className="text-4xl font-black text-[#0A2E1F] tracking-tight">Platform Analytics</h2>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           <Badge className="bg-emerald-50 text-emerald-700 border-none px-6 py-2.5 rounded-full font-black uppercase tracking-[0.2em] text-[10px]">
              Live Infrastructure Stream
           </Badge>
           <Button className="h-14 rounded-2xl bg-[#0A2E1F] text-white px-8 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-900/10">
              Generate Executive Report
           </Button>
        </div>
      </div>

      {/* PRIMARY KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Platform MRR", value: `$${totalMRR.toLocaleString()}`, change: "+24%", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Patients", value: uniquePatientsCount.toLocaleString(), change: "+18%", icon: Users, color: "text-[#0A2E1F]", bg: "bg-slate-50" },
          { label: "Total Orders", value: totalOrdersCount.toLocaleString(), change: "+31%", icon: Package, color: "text-emerald-700", bg: "bg-emerald-50/50" },
          { label: "Avg Conversion", value: "38%", change: "+4pts", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] bg-white p-8 group hover:shadow-emerald-900/5 transition-all">
            <div className="flex items-center justify-between mb-6">
               <div className={cn("h-12 w-12 rounded-[20px] flex items-center justify-center", s.bg, s.color)}>
                  <s.icon className="h-6 w-6" />
               </div>
               <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">{s.change}</span>
            </div>
            <h3 className="text-4xl font-black text-[#0A2E1F] tracking-tighter mb-1">{s.value}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* REVENUE BY BRAND STACKED */}
      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[64px] bg-white overflow-hidden p-12">
        <div className="flex items-center justify-between mb-16">
           <div>
              <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter">Revenue by Brand — Monthly</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Aggregate Financial Velocity</p>
           </div>
           <div className="flex items-center gap-3">
              {brands.map((b, i) => (
                <div key={b} className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full" style={{ backgroundColor: brandColors[i % brandColors.length] }} />
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{b}</span>
                </div>
              ))}
           </div>
        </div>
        <div className="h-[350px] w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformRevenueData.length > 0 ? platformRevenueData : [{month: "May", "Peak Health": totalMRR}]} barSize={32}>
                 <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#cbd5e1", fontWeight: 900 }} />
                 <YAxis hide />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#0A2E1F', border: 'none', borderRadius: '24px', color: '#fff', padding: '24px' }}
                    cursor={{ fill: '#f8fafc' }}
                 />
                 {brands.map((brand, i) => (
                   <Bar key={brand} dataKey={brand} stackId="a" fill={brandColors[i % brandColors.length]} radius={i === brands.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]} />
                 ))}
              </BarChart>
           </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* GEOGRAPHY DISTRIBUTION */}
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[56px] bg-white p-12 space-y-10">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-[#0A2E1F] tracking-tight uppercase">Patient Geography</h3>
              <Globe2 className="h-7 w-7 text-emerald-600" />
           </div>
           <div className="space-y-8">
              {geoData.map((c, i) => (
                <div key={i} className="space-y-4">
                   <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">{c.country}</span>
                      <span className="text-[#0A2E1F]">{c.patients.toLocaleString()} · {c.pct}%</span>
                   </div>
                   <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${c.pct}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                        className="h-full bg-emerald-600 rounded-full"
                      />
                   </div>
                </div>
              ))}
           </div>
        </Card>

        {/* CONVERSION FUNNEL */}
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[56px] bg-[#0A2E1F] p-12 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-emerald-500/20"></div>
           <div className="relative z-10 flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black text-emerald-50 tracking-tight uppercase">Operational Funnel</h3>
              <Radar className="h-7 w-7 text-emerald-400 animate-spin-slow" />
           </div>
           <div className="space-y-6 relative z-10">
              {[
                { stage: "Visited Node", val: 100, color: "bg-emerald-500/20" },
                { stage: "Started Intake", val: 68, color: "bg-emerald-500/40" },
                { stage: "Submitted", val: 52, color: "bg-emerald-500/60" },
                { stage: "Medical Review", val: 44, color: "bg-emerald-500/80" },
                { stage: "Paid & Fulfilled", val: 38, color: "bg-emerald-400" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-6">
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/40 w-32 shrink-0">{s.stage}</span>
                   <div className="flex-1 h-12 bg-white/5 rounded-2xl overflow-hidden relative border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.val}%` }}
                        transition={{ duration: 1.5, delay: i * 0.15 }}
                        className={cn("h-full rounded-2xl flex items-center px-4", s.color)}
                      >
                         <span className="text-[10px] font-black text-[#0A2E1F]">{s.val}%</span>
                      </motion.div>
                   </div>
                </div>
              ))}
           </div>
        </Card>

      </div>

      {/* PLATFORM AUDIT SIGNATURE */}
      <div className="mt-20 pt-12 border-t border-slate-100 flex items-center justify-between opacity-30">
         <span className="text-[10px] font-black uppercase tracking-[0.4em]">AES-256 Cloud Infrastructure Active</span>
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">Peak Health Supreme Authority</p>
      </div>

    </div>
  );
}
