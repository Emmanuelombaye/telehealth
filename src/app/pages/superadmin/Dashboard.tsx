import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Globe, TrendingUp, Users, DollarSign, Activity, ShieldCheck,
  AlertTriangle, Server, ArrowUpRight, Building2, Zap, CheckCircle2,
  Package, Clock, BarChart3, Lock, Shield, Database, Search, Bell,
  ChevronRight, Command, Layers, LayoutDashboard, PieChart
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../components/ui/shared.tsx";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { supabase } from "../../../lib/supabaseClient";

const revenueData = [
  { month: "Nov", revenue: 182000 }, { month: "Dec", revenue: 210000 },
  { month: "Jan", revenue: 198000 }, { month: "Feb", revenue: 234000 },
  { month: "Mar", revenue: 267000 }, { month: "Apr", revenue: 291000 },
  { month: "May", revenue: 318000 },
];

const brandRevenue = [
  { name: "GlowRx", revenue: 128000 },
  { name: "VitalCare", revenue: 94000 },
  { name: "PeakBody", revenue: 61000 },
  { name: "Truepill", revenue: 35000 },
];

const brands = [
  { id: 1, name: "GlowRx", slug: "glow-rx", domain: "glowrx.health", patients: 18420, doctors: 142, mrr: "$128,400", growth: "+24%", status: "active", country: "🇺🇸" },
  { id: 2, name: "VitalCare", slug: "vital-care", domain: "vitalcare.med", patients: 11230, doctors: 98, mrr: "$94,200", growth: "+18%", status: "active", country: "🇬🇧" },
  { id: 3, name: "PeakBody", slug: "peak-body", domain: "peakbody.co", patients: 7840, doctors: 61, mrr: "$61,000", growth: "+9%", status: "active", country: "🇦🇪" },
  { id: 4, name: "Truepill", slug: "truepill", domain: "truepill.com", patients: 3210, doctors: 28, mrr: "$35,000", growth: "+5%", status: "trial", country: "🇺🇸" },
];

const alerts = [
  { severity: "critical", title: "Brute Force Detected", desc: "GlowRx — 80+ failed logins from IP 203.0.113.42", time: "4m ago" },
  { severity: "warning", title: "High API Latency", desc: "VitalCare — avg response 820ms (threshold: 500ms)", time: "12m ago" },
  { severity: "info", title: "New Brand Onboarded", desc: "Truepill completed setup and went live", time: "2h ago" },
];

const recentActivity = [
  { brand: "GlowRx", action: "New doctor verified", user: "Dr. Sarah Johnson", time: "5m ago" },
  { brand: "VitalCare", action: "Payout processed", user: "Finance System", time: "22m ago" },
  { brand: "PeakBody", action: "Product added", user: "Admin Carlos", time: "1h ago" },
  { brand: "GlowRx", action: "Patient milestone: 18K", user: "System", time: "3h ago" },
];

export function SuperAdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase.from('orders').select('*');
        if (error) {
          if (error.code === '42P17' || error.message.includes('recursion')) {
             console.warn("RLS Recursion detected. Falling back to local state.");
             setOrders([
               { id: 1, amount: 245, patientName: "Sophie Bennett", status: "order_submitted" },
               { id: 2, amount: 35, patientName: "Caleb Montgomery", status: "medical_review" }
             ]);
             return;
          }
          throw error;
        }
        setOrders(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }
    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalMRR = orders.reduce((sum, order) => {
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    return sum + amt;
  }, 0);

    const uniquePatients = new Set(orders.map(o => o.patientName || o.patient_name)).size;

  const theme = {
    bg: "bg-[#060807]",
    card: "bg-[#0c120f]",
    border: "border-[#1a2620]",
    textGreen: "text-[#22c55e]",
    textBeige: "text-[#d4c4a8]",
    textMuted: "text-[#4f6458]",
  };

  return (
    <div className={`min-h-screen ${theme.bg} p-6 lg:p-10 font-sans antialiased text-white rounded-tl-[3rem] shadow-2xl -m-4 md:-m-8 animate-in fade-in duration-1000`}>
      
      {/* GLOBAL HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-5">
           <div className="h-12 w-12 rounded-2xl bg-violet-600/10 border border-violet-600/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.2)]">
             <Shield className="h-6 w-6 text-violet-500" />
           </div>
           <div>
             <div className="flex items-center gap-2 mb-1">
               <h1 className="text-2xl font-bold tracking-tight">Super Admin</h1>
               <span className="text-[10px] bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full border border-violet-600/30 font-black">PLATFORM CONTROL</span>
             </div>
             <p className="text-xs text-[#7f9488] font-medium uppercase tracking-widest">Global Brand Orchestration · {currentTime.toLocaleTimeString()}</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/superadmin/brands">
            <Button variant="outline" className="rounded-xl bg-[#0c120f] border-[#1a2620] hover:bg-[#1a2620] text-[#7f9488] hover:text-white transition-all gap-2 px-6">
              <Building2 size={16} /> Manage Brands
            </Button>
          </Link>
          <Link to="/superadmin/security">
            <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20 gap-2 px-6">
              <Lock size={16} /> Security Console
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Aggregate MRR", value: `$${totalMRR.toLocaleString(undefined, {minimumFractionDigits: 2})}`, sub: "GLOBAL PAYMENTS", icon: DollarSign, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", border: "border-[#22c55e]/20" },
          { label: "Active Brands", value: "8", sub: "READY FOR SCALE", icon: Building2, color: "text-[#d4c4a8]", bg: "bg-[#d4c4a8]/10", border: "border-[#d4c4a8]/20" },
          { label: "Global Users", value: "24.2K", sub: "CROSS-PORTAL", icon: Users, color: "text-violet-500", bg: "bg-violet-600/10", border: "border-violet-600/20" },
          { label: "System Health", value: "99.98%", sub: "INFRASTRUCTURE", icon: Server, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
        ].map((s, i) => (
          <div key={i} className={`${theme.card} ${s.border} border rounded-3xl p-6 hover:translate-y-[-4px] transition-all group shadow-xl shadow-black/40`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-[#7f9488] opacity-50" />
            </div>
            <p className="text-[10px] font-black text-[#4f6458] uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-3xl font-light text-white mb-1 tracking-tight group-hover:text-white transition-colors">{s.value}</h3>
            <span className={`text-[9px] font-black ${s.color} bg-white/5 px-2 py-0.5 rounded-full border border-white/5`}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        
        <div className={`${theme.card} ${theme.border} border rounded-[2rem] p-8 lg:col-span-2 relative overflow-hidden`}>
           <div className="absolute top-0 right-0 p-8 opacity-5">
             <LayoutDashboard size={120} className="text-violet-600" />
           </div>
           
           <div className="flex items-center justify-between mb-8 relative">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Platform Revenue Growth</h3>
                <p className="text-xs text-[#7f9488] font-medium">Aggregated revenue stream across all active brands</p>
              </div>
              <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 px-4 py-1.5">+24.8% YoY</Badge>
           </div>

           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="superRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a2620" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#4f6458", fontWeight: 'bold' }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0c120f', border: '1px solid #1a2620', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    formatter={(v: any) => [`$${(v / 1000).toFixed(0)}k`, "Revenue"]} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#superRev)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className={`${theme.card} ${theme.border} border rounded-[2rem] p-8`}>
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white tracking-tight">Market Distribution</h3>
              <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center">
                <PieChart size={16} className="text-[#7f9488]" />
              </div>
           </div>

           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandRevenue} barSize={24}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#4f6458", fontWeight: 'bold' }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0c120f', border: '1px solid #1a2620', borderRadius: '16px' }}
                    formatter={(v: any) => [`$${(v / 1000).toFixed(0)}k`]} 
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {brandRevenue.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#7c3aed" : i === 1 ? "#6d28d9" : i === 2 ? "#8b5cf6" : "#a78bfa"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>

           <div className="mt-8 space-y-4">
              {brandRevenue.map((b, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                   <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: i === 0 ? "#7c3aed" : i === 1 ? "#6d28d9" : i === 2 ? "#8b5cf6" : "#a78bfa" }}></div>
                      <span className="text-xs font-bold text-[#7f9488] uppercase group-hover:text-white transition-colors">{b.name}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-white">${(b.revenue / 1000).toFixed(1)}K</span>
                      <span className="text-[10px] font-bold text-[#22c55e]">+12%</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>

      {/* ALERTS & ACTIVITY */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        
        <div className={`${theme.card} ${theme.border} border rounded-[2rem] p-8`}>
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
                 </div>
                 <h3 className="text-xl font-bold text-white tracking-tight">Security Incident Log</h3>
              </div>
              <button className="text-xs font-black text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-widest">CLEAR ALL</button>
           </div>

           <div className="space-y-4">
              {alerts.map((a, i) => (
                <div key={i} className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                  a.severity === "critical" ? "bg-[#2d1212] border-[#ef4444]/20 hover:border-[#ef4444]/40" :
                  a.severity === "warning" ? "bg-[#2d2a24] border-amber-500/20 hover:border-amber-500/40" :
                  "bg-[#1a2620] border-[#22c55e]/20 hover:border-[#22c55e]/40"}`}>
                  <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                    a.severity === "critical" ? "bg-[#ef4444] animate-pulse shadow-[0_0_10px_#ef4444]" :
                    a.severity === "warning" ? "bg-amber-500" : "bg-[#22c55e]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-white group-hover:text-white transition-colors">{a.title}</p>
                      <span className="text-[10px] font-black text-[#4f6458] uppercase">{a.time}</span>
                    </div>
                    <p className="text-xs text-[#7f9488] font-medium leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className={`${theme.card} ${theme.border} border rounded-[2rem] p-8`}>
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-violet-500" />
                 </div>
                 <h3 className="text-xl font-bold text-white tracking-tight">Real-time Events</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-[#22c55e] uppercase bg-[#22c55e]/10 px-3 py-1 rounded-full border border-[#22c55e]/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c55e]"></span>
                </span>
                STREAMING
              </div>
           </div>

           <div className="space-y-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-600/20 group-hover:bg-violet-600 group-hover:border-violet-600 transition-all">
                    <Zap className="h-4 w-4 text-violet-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white tracking-tight">{a.action}</p>
                    <p className="text-[10px] font-black text-[#4f6458] uppercase tracking-tighter mt-0.5">{a.brand} · {a.user}</p>
                  </div>
                  <span className="text-[10px] font-black text-[#4f6458] uppercase">{a.time}</span>
                </div>
              ))}
           </div>
        </div>

      </div>

      {/* SYSTEM INFRASTRUCTURE HEATMAP */}
      <div className={`${theme.card} ${theme.border} border rounded-[2.5rem] p-10`}>
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Infrastructure Pulse</h3>
              <p className="text-sm text-[#7f9488] font-medium mt-1">Cross-regional availability and latency metrics</p>
            </div>
            <div className="flex gap-4">
               {[
                 { label: "API", value: "14ms", status: "STABLE" },
                 { label: "DB", value: "99.99%", status: "OPTIMAL" },
                 { label: "AUTH", value: "42ms", status: "HEALTHY" },
               ].map((m, i) => (
                 <div key={i} className="bg-[#1a2620] border border-[#1a2620] rounded-xl px-5 py-3 text-center min-w-[100px]">
                    <p className="text-[9px] font-black text-[#4f6458] mb-1 uppercase tracking-widest">{m.label}</p>
                    <p className="text-lg font-bold text-[#22c55e]">{m.value}</p>
                    <p className="text-[8px] font-black text-[#22c55e]/50 tracking-tighter">{m.status}</p>
                 </div>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {Array.from({ length: 32 }).map((_, i) => {
              const intensity = 0.4 + Math.random() * 0.6;
              const status = intensity > 0.9 ? 'CRITICAL' : intensity > 0.7 ? 'HEALTHY' : 'DEGRADED';
              return (
                <div key={i} className="group relative">
                  <div 
                    className="h-16 rounded-xl transition-all duration-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] cursor-pointer border border-white/5" 
                    style={{ backgroundColor: intensity > 0.9 ? '#ef4444' : intensity > 0.6 ? '#22c55e' : '#f59e0b', opacity: intensity }}
                  ></div>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0c120f] border border-[#1a2620] px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    <p className="text-[9px] font-black text-white uppercase mb-0.5">Node {i + 1}</p>
                    <p className="text-[8px] font-bold text-[#7f9488] uppercase">{status} · {Math.floor(intensity * 100)}% LOAD</p>
                  </div>
                </div>
              );
            })}
         </div>

         <div className="mt-10 pt-10 border-t border-[#1a2620] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]"></div>
                  <span className="text-[10px] font-black text-[#4f6458] uppercase">NODE ONLINE</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]"></div>
                  <span className="text-[10px] font-black text-[#4f6458] uppercase">HIGH LOAD</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ef4444]"></div>
                  <span className="text-[10px] font-black text-[#4f6458] uppercase">CRITICAL FAULT</span>
               </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-[#4f6458] uppercase tracking-[0.3em]">Peak Health Orchestrator v4.2.1</span>
              <Database className="h-4 w-4 text-[#1a2620]" />
            </div>
         </div>
      </div>

    </div>
  );
}
