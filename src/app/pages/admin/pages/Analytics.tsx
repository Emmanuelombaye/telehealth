import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Activity, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "../../../components/ui/shared.tsx";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { usePatientStore } from "../../../../lib";

export function AdminAnalyticsPage() {
  const { orders, fetchOrders } = usePatientStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await fetchOrders();
      setLoading(false);
    };
    init();
  }, [fetchOrders]);

  // Real-time Analytics Logic
  const stats = useMemo(() => {
    if (!orders.length) return {
      revenue: "$0",
      patients: "0",
      consults: "0",
      rating: "4.87", // Keep rating static as a performance metric for now
      revenueData: [],
      topTreatments: [],
      countries: []
    };

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
        patients: mOrders.length
      });
    }

    // 3. Top Treatments
    const treatmentMap: Record<string, { revenue: number, count: number }> = {};
    orders.forEach(o => {
      const med = o.medication || "Consultation";
      if (!treatmentMap[med]) treatmentMap[med] = { revenue: 0, count: 0 };
      treatmentMap[med].revenue += parseFloat(o.amount?.replace(/[$,]/g, '') || "0");
      treatmentMap[med].count += 1;
    });

    const topTreatments = Object.entries(treatmentMap)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    // 4. Global Distribution
    const countryMap: Record<string, number> = {};
    orders.forEach(o => {
      const c = o.patientCountry || "United States";
      countryMap[c] = (countryMap[c] || 0) + 1;
    });

    const countries = Object.entries(countryMap)
      .map(([country, count]) => ({
        country: country === "US" || country === "United States" ? "🇺🇸 United States" : `🌐 ${country}`,
        patients: count,
        pct: Math.round((count / orders.length) * 100)
      }))
      .sort((a, b) => b.patients - a.patients);

    return {
      revenue: `$${totalRevenue.toLocaleString()}`,
      patients: currentMonthOrders.length.toString(),
      consults: totalConsults.toLocaleString(),
      rating: "4.92",
      revenueData: last6Months,
      topTreatments,
      countries
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">Intelligence Terminal</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Global Health Matrix · Real-time Analytics</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
          <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white border-none px-4 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Badge>
          <div className="h-4 w-[1px] bg-slate-200 mx-1" />
          <div className="flex items-center gap-2 px-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Gross Revenue", value: stats.revenue, change: "+14.2%", icon: DollarSign, color: "text-emerald-500", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20" },
          { label: "Active Patients", value: stats.patients, change: "+22.5%", icon: Users, color: "text-blue-500", bg: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20" },
          { label: "Consultations", value: stats.consults, change: "+8.1%", icon: Activity, color: "text-purple-500", bg: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/20" },
          { label: "Clinical Satisfaction", value: stats.rating, change: "+0.02", icon: TrendingUp, color: "text-amber-500", bg: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20" },
        ].map((s, i) => (
          <div key={i} className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
            <Card className="relative border border-white/80 bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl bg-white shadow-inner border border-slate-50 ${s.color}`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50 shadow-sm">{s.change}</span>
                  </div>
                </div>
                <p className="text-4xl font-black italic tracking-tighter text-slate-900 mb-1">{s.value}</p>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">{s.label}</p>
                
                <div className={`mt-6 h-1 w-full bg-slate-50 rounded-full overflow-hidden`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "70%" }}
                    transition={{ duration: 1.5, delay: i * 0.2 }}
                    className={`h-full bg-gradient-to-r from-transparent to-current ${s.color}`} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none bg-white/60 backdrop-blur-md rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Growth Performance</CardTitle>
                <p className="text-xl font-black italic text-slate-800 tracking-tight">Revenue & Patient Acquisition Matrix</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase">Live Data</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[320px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 900, fill: "#cbd5e1" }} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                    contentStyle={{ borderRadius: "24px", border: "none", boxShadow: "0 20px 50px rgba(0,0,0,0.1)", padding: "16px" }} 
                    formatter={(v: any) => [`$${v.toLocaleString()}`, "Revenue"]} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none bg-[#0a2e1f] rounded-[3rem] shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Globe className="h-32 w-32 text-white" />
            </div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60">Global Reach</CardTitle>
              <p className="text-xl font-black italic text-white tracking-tight">Patient Distribution</p>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              {stats.countries.map((c, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black italic uppercase tracking-tight text-white/80">{c.country}</span>
                    <span className="text-emerald-400 font-bold">{c.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${c.pct}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    />
                  </div>
                </div>
              ))}
              {stats.countries.length === 0 && (
                <p className="text-[10px] font-black text-white/20 uppercase italic py-8">Awaiting deployment...</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-white/60 backdrop-blur-md rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">High Performance</CardTitle>
              <p className="text-xl font-black italic text-slate-800 tracking-tight">Top Protocol Revenue</p>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {stats.topTreatments.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white hover:bg-white transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        0{i+1}
                      </div>
                      <span className="text-xs font-black italic uppercase tracking-tight text-slate-600">{t.name}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600">${t.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
