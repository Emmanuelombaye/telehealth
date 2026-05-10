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
           <div className="h-16 w-16 rounded-2xl bg-emerald-600/10 flex items-center justify-center">
             <ShieldCheck className="h-8 w-8 text-emerald-600" />
           </div>
           <div>
             <div className="flex items-center gap-3 mb-1">
               <h1 className="text-4xl font-black tracking-tight text-[#0A0D14]">Super Admin</h1>
               <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 py-1 font-black uppercase tracking-widest text-[10px]">PLATFORM CONTROL</Badge>
             </div>
             <p className="text-slate-500 font-medium">Global Brand Orchestration & Platform Analytics</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/admin/orders">
            <Button variant="outline" className="h-12 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50 transition-all gap-2 px-6 shadow-sm">
              <Package size={18} /> Global Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Aggregate MRR", value: `$${totalMRR.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: "GLOBAL PAYMENTS", icon: DollarSign, color: "text-[#D4AF37]", bg: "bg-amber-50 border border-amber-200 shadow-[0_0_15px_rgba(212,175,55,0.2)] animate-pulse-gold" },
          { label: "Active Brands", value: activeBrandsCount.toString(), sub: "READY FOR SCALE", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Global Users", value: uniquePatients.toString() || "0", sub: "CROSS-PORTAL", icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "System Health", value: "99.98%", sub: "INFRASTRUCTURE", icon: Server, color: "text-amber-500", bg: "bg-amber-50" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 animate-bounce-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <CardContent className="p-8 relative overflow-hidden">
              {i === 0 && <div className="absolute inset-0 opacity-20 pointer-events-none animate-shimmer"></div>}
              <div className="flex items-start justify-between mb-6">
                <div className={`h-14 w-14 rounded-2xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-7 w-7 ${s.color}`} />
                </div>
                <TrendingUp className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-4xl font-black text-[#0A0D14] tracking-tight">{s.value}</p>
              <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">{s.label}</p>
              <p className="text-xs font-medium text-slate-400 mt-3">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 animate-bounce-in" style={{ animationDelay: "0.4s" }}>
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[32px] h-full overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-1000 pointer-events-none">
               <Globe size={200} />
             </div>
             
             <CardContent className="p-8 h-full flex flex-col">
               <div className="flex items-center justify-between mb-8 relative">
                  <div>
                    <h3 className="text-2xl font-black text-[#0A0D14] tracking-tight">Platform Revenue Growth</h3>
                    <p className="text-slate-500 font-medium">Aggregated revenue stream across all active brands</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">+24.8% YoY</Badge>
               </div>

               <div className="h-[300px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={liveRevenueData.length > 0 ? liveRevenueData : [{month: "Current", revenue: totalMRR}]}>
                      <defs>
                        <linearGradient id="superRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0D14', border: 'none', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                        itemStyle={{ color: '#10b981', fontWeight: 800 }}
                        formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, "Revenue"]} 
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#superRev)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
             </CardContent>
          </Card>
        </div>

        <div className="animate-bounce-in" style={{ animationDelay: "0.5s" }}>
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[32px] h-full flex flex-col hover:-translate-y-1 transition-all duration-500">
             <CardContent className="p-8 h-full flex flex-col relative">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-[#0A0D14] tracking-tight">Market Distribution</h3>
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Building2 size={20} className="text-slate-400" />
                  </div>
               </div>

               <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]} barSize={32}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0D14', border: 'none', borderRadius: '16px', color: '#fff' }}
                        itemStyle={{ color: '#10b981', fontWeight: 800 }}
                        formatter={(v: any) => [`$${(v / 1000).toFixed(1)}k`, 'Revenue']} 
                      />
                      <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                        {(liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]).map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#10b981" : i === 1 ? "#34d399" : i === 2 ? "#6ee7b7" : "#a7f3d0"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>

               <div className="mt-8 space-y-4 flex-1">
                  {(liveBrandRevenue.length ? liveBrandRevenue : [{name: 'Peak Health', revenue: totalMRR}]).map((b, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-default p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: i === 0 ? "#10b981" : i === 1 ? "#34d399" : i === 2 ? "#6ee7b7" : "#a7f3d0" }}></div>
                          <span className="text-sm font-bold text-slate-600 uppercase tracking-wide group-hover:text-[#0A0D14] transition-colors">{b.name}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-[#0A0D14]">${(b.revenue / 1000).toFixed(1)}K</span>
                       </div>
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
