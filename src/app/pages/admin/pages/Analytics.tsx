import { useState, useEffect, useMemo } from "react";
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
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold italic tracking-tight uppercase">Platform Intelligence</h1>
        <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          Real-time: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Current Month Revenue", value: stats.revenue, change: "+14%", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/5" },
          { label: "Active Month Patients", value: stats.patients, change: "+22%", icon: Users, color: "text-violet-600", bg: "bg-violet-500/5" },
          { label: "Total Clinical Consults", value: stats.consults, change: "+8%", icon: Activity, color: "text-purple-600", bg: "bg-purple-500/5" },
          { label: "Avg Clinical Rating", value: stats.rating, change: "+0.02", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-500/5" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-4 relative">
               <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full ${s.bg} blur-2xl group-hover:scale-150 transition-transform`} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className={cn("p-2 rounded-xl", s.bg)}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">{s.change}</span>
              </div>
              <p className="text-2xl font-black italic tracking-tighter relative z-10">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2 pt-5 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Growth Trajectory</CardTitle>
              <p className="text-xs font-bold text-slate-600 mt-1 italic">Monthly Revenue vs Patient Acquisition</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500 opacity-20" />
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-6">
          <div className="h-[240px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: "#94a3b8" }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", fontSize: 11, fontWeight: 800 }} 
                  formatter={(v: any) => [`$${v.toLocaleString()}`, "Revenue"]} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">High Volume Protocols</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-6">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topTreatments} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: "#64748b" }} 
                    width={100} 
                  />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 11, fontWeight: 800 }} formatter={(v: any) => [`$${v.toLocaleString()}`]} />
                  <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                    {stats.topTreatments.map((_, i) => <Cell key={i} fill={i === 0 ? "#10b981" : "#e2e8f0"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Global Clinical Specimen Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {stats.countries.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-black italic uppercase tracking-tight text-slate-600">{c.country}</span>
                  <span className="text-slate-400 font-bold">{c.patients.toLocaleString()} · {c.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
            {stats.countries.length === 0 && (
              <div className="py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                Awaiting international deployment data...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
