import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ShoppingCart, DollarSign, Activity, Users,
  Clock, CheckCircle2, AlertCircle, ChevronRight,
  TrendingUp, FileText, LayoutDashboard, Search, Bell
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../components/ui/shared.tsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";

export function AdminDashboard() {
  const user = useAuthStore(state => state.user);
  const adminName = user?.user_metadata?.first_name || "Admin";
  
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
      .channel('admin-orders-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalRevenue = orders.reduce((sum, order) => {
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    return sum + amt;
  }, 0);

  const pendingCount = orders.filter(o => o.status === 'order_submitted' || o.status === 'medical_review').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  
  const recentOrders = orders.slice(0, 5);

  // Group revenue by day for the chart
  const revenueByDay = orders.reduce((acc, order) => {
    const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    if (!acc[date]) acc[date] = 0;
    acc[date] += amt;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })).reverse().slice(0, 7).reverse();
  if (chartData.length === 0) chartData.push({ date: "Today", amount: totalRevenue });

  return (
    <div className="min-h-screen bg-[#F8FAF9] p-6 lg:p-10 font-sans text-[#0A0D14] animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4 animate-slide-in-right">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#0A0D14]">
            Welcome back, <span className="text-emerald-600 italic font-serif">{adminName}</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Brand Operations & Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search orders, patients..."
              className="w-64 bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
            />
          </div>
          <button className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm relative">
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && <span className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, sub: "+12.5% this month", icon: DollarSign, color: "text-[#D4AF37]", bg: "bg-amber-50 border border-amber-200 shadow-[0_0_15px_rgba(212,175,55,0.2)] animate-pulse-gold" },
          { label: "Active Orders", value: orders.length.toString(), sub: "All time", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Review", value: pendingCount.toString(), sub: "Requires attention", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Successfully Shipped", value: shippedCount.toString(), sub: "Completed flow", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 animate-bounce-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <CardContent className="p-8 relative overflow-hidden">
              {i === 0 && <div className="absolute inset-0 opacity-20 pointer-events-none animate-shimmer"></div>}
              <div className="flex items-start justify-between mb-6">
                <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <TrendingUp className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <p className="text-4xl font-black text-[#0A0D14] tracking-tight">{stat.value}</p>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xs font-medium text-slate-400 mt-3">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* CHART SECTION */}
        <div className="lg:col-span-2 animate-bounce-in" style={{ animationDelay: "0.4s" }}>
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[32px] h-full overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-1000 pointer-events-none">
              <Activity size={200} />
            </div>
            <CardContent className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-[#0A0D14] tracking-tight">Revenue Trajectory</h3>
                  <p className="text-slate-500 font-medium">Last 7 active days</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">LIVE SYNC</Badge>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0D14', border: 'none', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                      itemStyle={{ color: '#10b981', fontWeight: 800 }}
                      formatter={(value: any) => [`$${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RECENT ORDERS */}
        <div className="lg:col-span-1 animate-bounce-in" style={{ animationDelay: "0.5s" }}>
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[32px] h-full flex flex-col hover:-translate-y-1 transition-all duration-500">
            <CardContent className="p-8 flex flex-col h-full relative">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-[#0A0D14] tracking-tight">Recent Orders</h3>
                <Link to="/admin/orders">
                  <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-black uppercase tracking-widest px-4">View All</Button>
                </Link>
              </div>
              
              <div className="space-y-4 flex-1">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold animate-pulse">Loading orders...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold">No orders yet.</div>
                ) : (
                  recentOrders.map((order, i) => (
                    <div key={order.id || i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group cursor-pointer">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#0A0D14] truncate">{order.patient_name || 'Unknown Patient'}</p>
                        <p className="text-xs text-slate-500 font-medium truncate">{order.medication || order.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">{typeof order.amount === 'number' ? `$${order.amount}` : order.amount}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{order.status === 'shipped' ? 'Shipped' : 'Pending'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <Link to="/admin/orders">
                  <Button className="w-full h-14 bg-[#0A0D14] hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-slate-900/10 hover:shadow-emerald-600/20">
                    Manage Orders <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
