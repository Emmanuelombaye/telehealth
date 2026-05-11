import { useState, useEffect, useMemo } from "react";
import {
  Users, Calendar, Clock, Search, Filter, MoreVertical,
  Video, FileText, MessageSquare, TrendingUp, UserCheck,
  ChevronRight, Activity, HeartPulse, Stethoscope, Zap,
  Bell, Command, ShieldCheck, Database, Layers, ArrowUpRight,
  Sparkles, FlaskConical, Bot, Pill
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from "../../components/ui/shared.tsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import { useI18n, getGreeting, usePatientStore, useAuthStore } from "../../../lib";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DoctorDashboard() {
  const { t } = useI18n();
  const greeting = getGreeting(t);
  const [currentTime, setCurrentTime] = useState(new Date());

  const user = useAuthStore(state => state.user);
  const doctorName = user?.user_metadata?.first_name
    ? `Dr. ${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : "Dr. Brandon 👨‍⚕️";

  const { orders, fetchOrders, subscribeToOrders } = usePatientStore();

  // Real metrics from database
  const pendingConsults = orders.filter(o => {
    const isActive = o.status === "order_submitted" || o.status === "medical_review" || o.status === "rx_sent";
    const needsRefill = o.nextRefillAt && new Date(o.nextRefillAt) <= new Date();
    return isActive || needsRefill;
  });
  const completedVisits = orders.filter(o => o.status === "shipped" || o.status === "delivered").length;
  const patientsToday = pendingConsults.length;

  // Throughput by day-of-week for the trailing 7 days
  const statsData = useMemo(() => {
    const now = new Date();
    const buckets: { name: string; visits: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      buckets.push({ name: DAY_LABELS[d.getDay()], visits: 0 });
    }
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    for (const o of orders) {
      const raw = (o as any).orderedDate || (o as any).ordered_date;
      if (!raw) continue;
      const od = new Date(raw);
      if (isNaN(od.getTime()) || od < sevenDaysAgo) continue;
      const dayDiff = Math.floor((od.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff >= 0 && dayDiff < 7) buckets[dayDiff].visits += 1;
    }
    return buckets;
  }, [orders]);

  // Active consult load by hour bucket for today
  const revenueData = useMemo(() => {
    const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
    const counts = slots.map(time => ({ time, active: 0 }));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const o of orders) {
      const raw = (o as any).orderedDate || (o as any).ordered_date;
      if (!raw) continue;
      const od = new Date(raw);
      if (isNaN(od.getTime()) || od < today) continue;
      const hr = od.getHours();
      const idx = Math.min(slots.length - 1, Math.max(0, Math.floor((hr - 8) / 2)));
      counts[idx].active += 1;
    }
    return counts;
  }, [orders]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [subscribeToOrders]);

  const theme = {
    bg: "bg-white",
    card: "bg-white",
    cardSolid: "bg-white",
    border: "border-slate-50",
    textMain: "text-[#0A0D14]",
    textMuted: "text-slate-400",
    textGreen: "text-[#0A2E1F]",
    textBeige: "text-[#0A0D14]",
    accent: "bg-[#0A2E1F]",
    accentMuted: "bg-emerald-50",
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-1000">
      {/* Top Command Bar */}
      <div className="bg-white border border-slate-50 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="flex items-center gap-8 w-full md:w-auto relative z-10">
          <div className="h-20 w-20 rounded-3xl bg-[#0A2E1F] flex items-center justify-center shadow-2xl shadow-emerald-900/20 group">
             <Stethoscope className="h-10 w-10 text-white transition-transform duration-500 group-hover:scale-110" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-xl bg-emerald-50 text-[#0A2E1F] border border-emerald-100">
                CLINICAL COMMAND CENTER
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                STABLE v2.4.0
              </span>
            </div>
            <h1 className="text-4xl font-black text-[#0A2E1F] tracking-tighter flex items-center gap-4 italic uppercase">
              {doctorName}
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
              {currentTime.toLocaleTimeString()} • {greeting}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
          <div className="px-6 py-4 border-r border-slate-50 text-center">
            <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Latency</p>
            <p className="text-[#0A2E1F] text-2xl font-black italic">14ms</p>
          </div>
          <div className="px-6 py-4 border-r border-slate-50 text-center">
             <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Status</p>
             <p className="text-emerald-600 text-2xl font-black italic tracking-widest uppercase">Live</p>
          </div>
          <div className="flex-1 md:flex-none pl-4">
             <Link to="/doctor/consult">
               <Button className="w-full md:w-auto rounded-3xl bg-[#0A2E1F] h-16 px-10 shadow-2xl shadow-emerald-900/10">
                 <Video className="mr-3 h-5 w-5" />
                 Launch Room
               </Button>
             </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Stats & Trends */}
        <div className="lg:col-span-4 space-y-6">
          {/* Real-time Telemetry Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`${theme.card} ${theme.border} border rounded-[2rem] p-8 relative overflow-hidden shadow-sm`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <Activity className="h-32 w-32" />
            </div>
            
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8">System Telemetry</h3>
            
            <div className="space-y-8 relative z-10">
              {[
                { label: "Active Queue", value: patientsToday, sub: "Patients waiting", icon: Users, color: "#059669" },
                { label: "Wait Intensity", value: "8.4m", sub: "Load: Normal", icon: Zap, color: "#0F172A" },
                { label: "Consults Done", value: completedVisits, sub: "Shift aggregate", icon: UserCheck, color: "#059669" }
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                       <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className={`${theme.textMuted} text-[10px] font-black uppercase tracking-widest`}>{stat.label}</p>
                      <p className={`${theme.textBeige} text-xs font-bold`}>{stat.sub}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black italic`} style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="emerald-600" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="emerald-600" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="active" stroke="#10b981" fillOpacity={1} fill="url(#colorActive)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-2 gap-4">
             {[
               { label: "Messages", count: 4, icon: MessageSquare, href: "/doctor/messages" },
               { label: "Scribe AI", count: "Beta", icon: Bot, href: "/doctor/scribe" },
               { label: "E-Scripts", count: 12, icon: Pill, href: "/doctor/erx" },
               { label: "Lab Flow", count: 2, icon: FlaskConical, href: "/doctor/labs" }
             ].map((item, i) => (
               <Link key={i} to={item.href} className="group">
                 <div className={`${theme.card} ${theme.border} border rounded-[1.5rem] p-5 hover:bg-[#1a2620] transition-all hover:-translate-y-1 active:scale-95 cursor-pointer`}>
                   <div className="flex justify-between items-start mb-4">
                     <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-slate-100 group-hover:border-[emerald-600]/30 group-hover:bg-emerald-600/10 transition-all">
                       <item.icon className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                     </div>
                     <Badge className="bg-white/5 text-slate-400 border-none font-black text-[9px] uppercase italic">{item.count}</Badge>
                   </div>
                   <p className={`${theme.textMain} text-[10px] font-black uppercase tracking-widest`}>{item.label}</p>
                 </div>
               </Link>
             ))}
          </div>
        </div>

        {/* Center/Right Column: Patient Queue Table */}
        <div className="lg:col-span-8 space-y-6">
           <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`${theme.card} ${theme.border} border rounded-[2rem] overflow-hidden flex flex-col shadow-sm`}
           >
             <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-50/50 to-transparent">
               <div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                   Active Patient Queue
                   <div className="h-2 w-2 rounded-full bg-emerald-600" />
                 </h2>
                 <p className={`${theme.textMuted} text-xs font-bold uppercase tracking-[0.2em] mt-1`}>
                   Authorized Personnel Only • {pendingConsults.length} High-priority items
                 </p>
               </div>
               <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="relative flex-1 md:w-64">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
                   <Input placeholder="Search Matrix..." className="bg-white border-slate-200 rounded-xl pl-10 text-sm italic font-bold focus:border-emerald-500/50 transition-all" />
                 </div>
                 <Button variant="outline" className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 h-10 w-10 p-0">
                   <Filter className="h-4 w-4 text-slate-500" />
                 </Button>
               </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                 <thead>
                   <tr className="border-b border-slate-100">
                     <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Specimen</th>
                     <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inference/Category</th>
                     <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status Index</th>
                     <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time Delta</th>
                     <th className="text-right p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   <AnimatePresence>
                     {pendingConsults.map((order, i) => (
                       <motion.tr 
                        key={order.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                       >
                         <td className="p-6">
                           <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center border border-emerald-300 relative">
                                <span className="text-xs font-black text-emerald-700">{order.patientName?.charAt(0)}</span>
                                {order.urgent && (
                                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-slate-100 border-white animate-ping" />
                                )}
                             </div>
                             <div>
                               <p className="text-sm font-black text-[#0F172A] italic">{order.patientName}</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase">{(order as any).order_number || order.id.slice(0,8)}</p>
                             </div>
                           </div>
                         </td>
                         <td className="p-6">
                            <p className="text-xs font-bold text-slate-700">{order.medication}</p>
                            <p className="text-[10px] text-slate-400 italic uppercase mt-0.5">{order.category}</p>
                         </td>
                         <td className="p-6">
                            <div className="flex items-center gap-2">
                              <div className={`h-1.5 w-1.5 rounded-full ${order.status === 'medical_review' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'medical_review' ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {order.status?.replace('_', ' ')}
                              </span>
                            </div>
                         </td>
                         <td className="p-6">
                            <p className="text-xs font-bold text-slate-700">{new Date(order.orderedDate || (order as any).ordered_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[10px] text-slate-400 italic font-bold">Latency: 12m</p>
                         </td>
                         <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-500/50 p-0">
                                <Video className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-500/50 p-0">
                                <ChevronRight className="h-4 w-4 text-slate-900" />
                              </Button>
                            </div>
                         </td>
                       </motion.tr>
                     ))}
                   </AnimatePresence>
                 </tbody>
               </table>
               {pendingConsults.length === 0 && (
                 <div className="p-20 text-center">
                    <Database className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-200 italic">No Active Matrices Found</p>
                 </div>
               )}
             </div>

             <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page 1 of 1 • System Synchronized</p>
               <Link to="/doctor/queue">
                 <Button variant="ghost" className="text-[10px] font-black uppercase italic tracking-widest text-emerald-600 hover:bg-emerald-600/10 gap-2 group">
                   Access Full Ledger <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                 </Button>
               </Link>
             </div>
           </motion.div>

           {/* Metrics Grid */}
           <div className="grid md:grid-cols-2 gap-6">
              <motion.div 
                whileHover={{ y: -5 }}
                className={`${theme.card} ${theme.border} border rounded-[2rem] p-8`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Consultation Throughput</h4>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="h-[150px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <Bar dataKey="visits" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className={`${theme.card} ${theme.border} border rounded-[2rem] p-8`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">AI Insight Score</h4>
                  <Sparkles className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-5xl font-black text-[#0F172A] italic tracking-tighter">98.2</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">+2.4% PERFORMANCE DELTA</p>
                  </div>
                  <div className="h-20 w-20 rounded-full border-4 border-[#1a2620] border-t-[emerald-600] flex items-center justify-center">
                    <p className="text-[10px] font-black text-[#0F172A]">OPTIMAL</p>
                  </div>
                </div>
              </motion.div>
           </div>
        </div>
      </div>
    </div>
  );
}
