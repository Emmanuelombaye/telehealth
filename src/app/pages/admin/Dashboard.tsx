import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ShoppingCart, DollarSign, Activity, Users,
  Clock, CheckCircle2, AlertCircle, ChevronRight,
  TrendingUp, FileText, LayoutDashboard, Search, Bell,
  Shield, Zap, Rocket, Pill, BarChart3, Globe
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../components/ui/shared.tsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT, applyOrdersBrandScope } from "../../../lib/adminScope";
import { motion, AnimatePresence } from "framer-motion";

export function AdminDashboard() {
  const user = useAuthStore(state => state.user);
  const role = useAuthStore(state => state.role);
  const brandId = useAuthStore(state => state.brandId);
  const adminName = user?.user_metadata?.first_name || "Admin";
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        let q = supabase
          .from('orders')
          .select(ORDERS_ADMIN_NON_CLINICAL_SELECT)
          .order('created_at', { ascending: false });
        q = applyOrdersBrandScope(q, role, brandId);
        const { data, error } = await q;
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
      .channel('admin-orders-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [role, brandId]);

  const totalRevenue = (orders || []).reduce((sum, order) => {
    if (!order) return sum;
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount || 0).replace(/[^0-9.-]+/g,"")) || 0;
    return sum + amt;
  }, 0);

  const pendingCount = orders.filter(o => o.status === 'order_submitted' || o.status === 'medical_review').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  
  const recentOrders = orders.slice(0, 5);

  const revenueByDay = (orders || []).reduce((acc, order) => {
    if (!order?.created_at) return acc;
    const d = new Date(order.created_at);
    if (isNaN(d.getTime())) return acc;
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount || 0).replace(/[^0-9.-]+/g,"")) || 0;
    if (!acc[date]) acc[date] = 0;
    acc[date] += amt;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })).reverse().slice(0, 7).reverse();
  if (chartData.length === 0) chartData.push({ date: "Today", amount: totalRevenue });

  return (
    <div className="min-h-screen bg-white p-6 lg:p-10 font-sans text-[#0A0D14] animate-in fade-in duration-700">
      
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-8 animate-slide-in-right">
        <div className="flex items-center gap-8">
           <div className="h-20 w-20 rounded-[28px] bg-emerald-50 flex items-center justify-center shadow-xl shadow-emerald-100/50 border border-emerald-100">
              <LayoutDashboard size={32} className="text-emerald-600" />
           </div>
           <div>
              <h1 className="text-5xl font-black tracking-tight text-[#0A2E1F] leading-tight">
                Welcome, <span className="text-emerald-600 font-serif italic">{adminName}</span>
              </h1>
              <div className="flex items-center gap-4 mt-1">
                 <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-1 font-black uppercase tracking-widest text-[9px] rounded-full">BRAND OPERATOR</Badge>
                 <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                    <Activity size={16} className="text-emerald-500 animate-pulse" /> Live Brand Synchronization
                 </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative hidden xl:block">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search command center..."
                className="w-80 bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
              />
           </div>
           <Link to="/admin/orders">
             <Button className="h-14 rounded-2xl bg-[#0A2E1F] text-white hover:bg-emerald-950 px-8 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-900/10">
                New Order <Plus className="ml-2 h-4 w-4" />
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-10">
        
        {/* MAIN OPERATIONS (LHS) */}
        <div className="lg:col-span-3 space-y-10">
           
           {/* LUXURY KPI STRIP */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", sub: "+14.2% Growth" },
                { label: "Active Orders", value: orders.length.toString(), icon: ShoppingCart, color: "text-[#0A2E1F]", sub: "Live Fulfillment" },
                { label: "Review Queue", value: pendingCount.toString(), icon: Clock, color: "text-amber-600", sub: "Requires Action" }
              ].map((s, i) => (
                <Card key={i} className="border-none shadow-2xl shadow-slate-100/50 rounded-[40px] bg-white p-10 group hover:shadow-emerald-900/5 transition-all">
                   <div className="flex items-start justify-between mb-8">
                      <div className={cn("h-16 w-16 rounded-[24px] flex items-center justify-center group-hover:scale-110 transition-transform bg-slate-50", s.color)}>
                         <s.icon className="h-8 w-8" />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{s.sub}</span>
                   </div>
                   <h2 className="text-4xl font-black tracking-tighter text-[#0A2E1F]">{s.value}</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">{s.label}</p>
                </Card>
              ))}
           </div>

           {/* REVENUE CHART */}
           <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[56px] bg-white overflow-hidden p-12">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter">Financial Velocity</h3>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Brand Performance Architecture</p>
                 </div>
                 <div className="flex gap-4">
                    <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-1.5 font-black uppercase tracking-widest text-[9px]">7 DAY PULSE</Badge>
                 </div>
              </div>
              <div className="h-[400px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#cbd5e1", fontWeight: 900 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A2E1F', border: 'none', borderRadius: '32px', color: '#fff', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', padding: '24px' }}
                        itemStyle={{ color: '#10b981', fontWeight: 950, fontSize: '18px' }}
                        formatter={(v: any) => [`$${v.toLocaleString()}`, "REVENUE"]} 
                      />
                      <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#adminRev)" strokeWidth={6} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>
        </div>

        {/* EXECUTIVE COMMAND STRIP (RHS) */}
        <div className="lg:col-span-1 space-y-8">
           
           {/* BRAND HEALTH CARD */}
           <Card className="border-none shadow-3xl shadow-emerald-900/20 rounded-[48px] bg-gradient-to-br from-[#0A2E1F] to-[#051810] text-white p-10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
              <div className="relative z-10 space-y-10">
                 <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black tracking-tight text-emerald-50">Brand Pulse</h3>
                    <Activity className="h-6 w-6 text-emerald-400 animate-pulse" />
                 </div>
                 <div className="space-y-6">
                    {[
                      { label: "Active Patients", val: uniquePatientsCount(orders), icon: Users },
                      { label: "Fulfillment Rate", val: "99.2%", icon: Zap },
                      { label: "Average AOV", val: `$${(totalRevenue / (orders.length || 1)).toFixed(0)}`, icon: DollarSign },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-5 p-5 rounded-[24px] bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
                         <div className="h-12 w-12 rounded-[18px] bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <m.icon size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100/50">{m.label}</p>
                            <p className="text-lg font-black text-white leading-none mt-1">{m.val}</p>
                         </div>
                      </div>
                    ))}
                 </div>
                 <Link to="/admin/analytics">
                    <Button className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#0A2E1F] font-black uppercase tracking-widest text-[10px] border-none">
                       Deep Analytics
                    </Button>
                 </Link>
              </div>
           </Card>

           {/* RECENT ACTIVITY COMMANDS */}
           <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[48px] bg-white p-10 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-black tracking-tight text-[#0A2E1F]">Live Orders</h3>
                 <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Rocket size={20} />
                 </div>
              </div>
              <div className="space-y-6">
                 {recentOrders.map((o, i) => (
                   <div key={i} className="flex items-center gap-4 group cursor-pointer">
                      <div className="h-12 w-12 rounded-[18px] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                         <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-black text-[#0A2E1F] truncate uppercase tracking-tight">{o.patient_name || 'System Test'}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.status === 'shipped' ? 'Dispatched' : 'In Review'}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-200 group-hover:translate-x-1 transition-all" />
                   </div>
                 ))}
              </div>
              <Link to="/admin/orders">
                 <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all">
                    View Full Queue
                 </Button>
              </Link>
           </Card>

        </div>
      </div>
    </div>
  );
}

function uniquePatientsCount(orders: any[]) {
  return new Set(orders.map(o => o.patient_name)).size.toString();
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
