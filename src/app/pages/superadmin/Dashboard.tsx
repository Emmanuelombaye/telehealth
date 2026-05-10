import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Globe, TrendingUp, Users, DollarSign, Activity, ShieldCheck,
  Server, Building2, Package, Search, Bell, Command, ChevronRight
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
      
      {/* GLOBAL HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4 animate-slide-in-right">
        <div className="flex items-center gap-5">
           <div className="h-16 w-16 rounded-2xl bg-[#0A2E1F] flex items-center justify-center shadow-xl shadow-emerald-900/20">
             <ShieldCheck className="h-8 w-8 text-emerald-400" />
           </div>
           <div>
             <div className="flex items-center gap-3 mb-1">
               <h1 className="text-4xl font-black tracking-tight text-[#0A2E1F]">Platform Executive</h1>
               <Badge className="bg-emerald-100 text-emerald-800 border-none px-3 py-1 font-black uppercase tracking-widest text-[10px]">SUPREME CONTROL</Badge>
             </div>
             <p className="text-slate-500 font-medium">Global Enterprise Brands & Liquidity Matrix</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/admin/orders">
            <Button className="h-14 rounded-2xl bg-white border border-slate-200 text-[#0A2E1F] hover:border-emerald-400 hover:bg-emerald-50 transition-all gap-2 px-8 shadow-sm font-bold">
              <Package size={20} className="text-emerald-600" /> Global Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Aggregate MRR", value: `$${totalMRR.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: "GLOBAL PAYMENTS", icon: DollarSign, color: "text-emerald-400", bg: "bg-gradient-to-br from-[#0A2E1F] to-[#051810]" },
          { label: "Active Brands", value: activeBrandsCount.toString(), sub: "READY FOR SCALE", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Global Users", value: uniquePatients.toString() || "0", sub: "CROSS-PORTAL", icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "System Health", value: "99.98%", sub: "INFRASTRUCTURE", icon: Server, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s, i) => (
          <Card key={i} className={cn("border-none shadow-xl shadow-slate-200/50 rounded-[32px] hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 animate-bounce-in", i === 0 && "overflow-hidden")} style={{ animationDelay: `${i * 0.15}s` }}>
            <CardContent className={cn("p-8 relative", i === 0 ? "bg-gradient-to-br from-[#0A2E1F] to-[#051810] text-white" : "bg-white")}>
              {i === 0 && <div className="absolute inset-0 opacity-20 pointer-events-none animate-shimmer bg-emerald-500/20"></div>}
              <div className="flex items-start justify-between mb-6">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", i === 0 ? "bg-white/10 border border-white/10" : s.bg)}>
                  <s.icon className={cn("h-7 w-7", i === 0 ? "text-emerald-400" : s.color)} />
                </div>
                <TrendingUp className={cn("h-5 w-5", i === 0 ? "text-emerald-500/40" : "text-slate-300")} />
              </div>
              <p className={cn("text-4xl font-black tracking-tight", i === 0 ? "text-white" : "text-[#0A0D14]")}>{s.value}</p>
              <p className={cn("text-sm font-bold mt-1 uppercase tracking-wider", i === 0 ? "text-emerald-400" : "text-slate-400")}>{s.label}</p>
              <p className={cn("text-xs font-medium mt-3", i === 0 ? "text-emerald-500/60" : "text-slate-400")}>{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* REVENUE GROWTH */}
        <div className="lg:col-span-2 animate-bounce-in" style={{ animationDelay: "0.4s" }}>
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[40px] h-full overflow-hidden relative group bg-white">
             <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 group-hover:opacity-[0.04] transition-all duration-1000 pointer-events-none">
               <Globe size={280} />
             </div>
             
             <CardContent className="p-10 h-full flex flex-col">
               <div className="flex items-center justify-between mb-10 relative">
                  <div>
                    <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tight">Revenue Stream</h3>
                    <p className="text-slate-500 font-medium text-base mt-1">Aggregated platform liquidity across all active brands</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px] mb-2">+24.8% YoY</Badge>
                  </div>
               </div>

               <div className="h-[340px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={liveRevenueData.length > 0 ? liveRevenueData : [{month: "Current", revenue: totalMRR}]}>
                      <defs>
                        <linearGradient id="luxRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 700 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A2E1F', border: 'none', borderRadius: '24px', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '16px' }}
                        itemStyle={{ color: '#34d399', fontWeight: 900, fontSize: '16px' }}
                        cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4 4' }}
                        formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, "Aggregate"]} 
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#luxRev)" strokeWidth={5} animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* THE "LUXURY" EXECUTIVE PERFORMANCE CARD */}
        <div className="animate-bounce-in" style={{ animationDelay: "0.5s" }}>
          <Card className="border-none shadow-2xl shadow-emerald-900/10 rounded-[40px] h-full flex flex-col bg-gradient-to-br from-[#0A2E1F] to-[#051810] text-white overflow-hidden relative group">
             {/* Luxury Decoration */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
             
             <CardContent className="p-10 h-full flex flex-col relative z-10">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-emerald-50">Market Share</h3>
                    <p className="text-emerald-500/60 text-xs font-bold uppercase tracking-widest mt-1">Executive Distribution</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-900/40">
                    <Building2 size={22} className="text-emerald-400" />
                  </div>
               </div>

               <div className="h-[220px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]} barSize={24}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#34d399", fontWeight: 700, opacity: 0.5 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '20px', color: '#0A2E1F', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#10b981', fontWeight: 900 }}
                        cursor={{ fill: 'rgba(52, 211, 153, 0.05)' }}
                        formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, 'Revenue']} 
                      />
                      <Bar dataKey="revenue" radius={[12, 12, 12, 12]}>
                        {(liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]).map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#10b981" : i === 1 ? "#34d399" : i === 2 ? "#6ee7b7" : "#a7f3d0"} className="hover:opacity-80 transition-opacity" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>

               <div className="space-y-3 flex-1">
                  {(liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]).map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 group/item">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-white/5 text-emerald-400 font-black text-xs border border-white/5 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                             {b.name.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-sm font-black text-emerald-50 uppercase tracking-wider">{b.name}</span>
                            <span className="block text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mt-0.5">Primary Tier</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-base font-black text-emerald-400 group-hover/item:text-white transition-colors">${(b.revenue / 1000).toFixed(1)}K</span>
                          <ChevronRight size={16} className="text-white/20 group-hover/item:text-emerald-400 transition-colors" />
                       </div>
                    </div>
                  ))}
               </div>

               <Link to="/superadmin/brands" className="mt-8">
                 <Button className="w-full h-14 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-[#0A2E1F] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                   Enterprise Brand Matrix Matrix
                 </Button>
               </Link>
             </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
