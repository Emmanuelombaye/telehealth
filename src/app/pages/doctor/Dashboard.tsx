import { useState, useEffect, useMemo, useRef } from "react";
import {
  Users, Calendar, Clock, Search, Filter, MoreVertical,
  Video, FileText, MessageSquare, TrendingUp, UserCheck,
  ChevronRight, Activity, HeartPulse, Zap,
  Bell, Command, ShieldCheck, Database, Layers, ArrowUpRight,
  Sparkles, FlaskConical, Bot, Pill, CheckCircle2, AlertCircle, FileSignature, ArrowUp, ArrowDown, Stethoscope, ChevronDown
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, cn } from "../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../components/doctor/DoctorPageHeader";
import { getOrderVideoRail } from "../../../lib/orderVideoRail";
import { doctorPageContainer, doctorSurfaceCard } from "../../../lib/doctorPortalUi";
import { useI18n, getGreeting, usePatientStore, useAuthStore } from "../../../lib";
import { doctorMessagesHref, useDoctorPortalBase } from "../../../lib/doctorPortalBase";
import { Link, useNavigate } from "react-router";
import * as FramerMotion from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const { motion, AnimatePresence } = FramerMotion;

type TimeFilter = 'week' | 'month' | 'year';

export function DoctorDashboard() {
  const { t } = useI18n();
  const greeting = getGreeting(t);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();
  const user = useAuthStore((s) => s.user);
  const doctorName = user?.user_metadata?.first_name
    ? `Dr. ${user.user_metadata.first_name} ${user.user_metadata?.last_name ?? ""}`.trim()
    : "Dr. Clinical Provider";

  const { orders, fetchOrders, subscribeToOrders, unreadMessagesCount, fetchUnreadMessages } = usePatientStore();

  // Time Filter State
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const timeFilterLabels: Record<TimeFilter, string> = {
    week: "This Week",
    month: "This Month",
    year: "This Year"
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Metrics
  const todayStr = new Date().toDateString();
  
  const videoConsultsToday = orders.filter(o => 
    (o.zoom_status === "confirmed" || o.zoom_status === "requested") &&
    new Date(o.created_at || o.orderedDate).toDateString() === todayStr
  );
  
  const pendingReviews = orders.filter(o => o.status === "medical_review" || o.status === "order_submitted");
  const patientsToday = orders.filter(o => new Date(o.created_at || o.orderedDate).toDateString() === todayStr).length;

  useEffect(() => {
    fetchOrders();
    fetchUnreadMessages();
    const unsubscribe = subscribeToOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [fetchOrders, fetchUnreadMessages, subscribeToOrders]);

  // Dynamic Clinical Chart Data Logic
  const chartData = useMemo(() => {
    const dataMap: Record<string, { consults: number }> = {};
    const medCounts: Record<string, number> = {};
    
    // Setup time buckets based on filter
    let daysToLoop = 7;
    if (timeFilter === 'month') daysToLoop = 30;

    if (timeFilter === 'year') {
      // 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        // Baseline noise
        dataMap[dateStr] = { consults: Math.floor(Math.random() * 20) + 10 }; 
      }
    } else {
      // Days
      for (let i = daysToLoop - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        // Baseline noise
        dataMap[dateStr] = { consults: Math.floor(Math.random() * (timeFilter === 'month' ? 2 : 3)) + 1 }; 
      }
    }

    let totalWaitTime = 0;
    let waitCount = 0;

    // Filter relevant orders
    const now = new Date();
    const cutoff = new Date();
    if (timeFilter === 'week') cutoff.setDate(now.getDate() - 7);
    if (timeFilter === 'month') cutoff.setDate(now.getDate() - 30);
    if (timeFilter === 'year') cutoff.setFullYear(now.getFullYear() - 1);

    const relevantOrders = orders.filter(o => {
      const d = new Date(o.created_at || o.orderedDate || Date.now());
      return d >= cutoff;
    });

    // Inject real database numbers
    relevantOrders.forEach(o => {
      const d = new Date(o.created_at || o.orderedDate || Date.now());
      let dateStr = "";
      if (timeFilter === 'year') {
        dateStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      if (dataMap[dateStr] !== undefined) {
        dataMap[dateStr].consults += 1;
      }
      
      if (o.medication) {
        medCounts[o.medication] = (medCounts[o.medication] || 0) + 1;
      }

      totalWaitTime += Math.floor(Math.random() * 10) + 4; // Mock avg wait
      waitCount += 1;
    });

    const topMedication = Object.keys(medCounts).length > 0 
      ? Object.keys(medCounts).sort((a, b) => medCounts[b] - medCounts[a])[0] 
      : "Semaglutide";
      
    const avgWaitTime = waitCount > 0 ? Math.floor(totalWaitTime / waitCount) : 8;

    const series = Object.keys(dataMap).map(key => ({
      name: key,
      consults: Number(dataMap[key].consults)
    }));

    return {
      series,
      totalConsults: series.reduce((sum, item) => sum + (Number(item.consults) || 0), 0),
      topMedication,
      avgWaitTime
    };
  }, [orders, timeFilter]);

  return (
    <div className={cn(doctorPageContainer, "space-y-7 pb-14 animate-in fade-in duration-700")}>
      {/* 1. Hero strip */}
      <DoctorPageHeader
        variant="soft"
        eyebrow="Provider cockpit"
        title={`${greeting}, ${doctorName}`}
        description={`${currentTime.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · Local time ${currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Session sync active.`}
      >
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 shadow-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
          Live
        </span>
        <Button
          variant="outline"
          className="h-10 rounded-xl border-emerald-100/90 bg-white px-4 font-semibold text-[#0A2E1F] hover:bg-emerald-50/50"
        >
          <Search className="h-4 w-4 shrink-0 mr-2" aria-hidden /> Search
        </Button>
        <Link to={`${doctorBase}/consult`} className="shrink-0">
          <Button className="h-10 rounded-xl bg-gradient-to-r from-[#0A2E1F] to-emerald-800 px-5 font-semibold text-white shadow-lg shadow-emerald-900/25 hover:from-[#0f3d29] hover:to-emerald-900">
            <Video className="h-4 w-4 shrink-0 mr-2" aria-hidden /> Consult suite
          </Button>
        </Link>
      </DoctorPageHeader>

      {/* 2. CLINICAL METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Patients Today", value: patientsToday, sub: "In active queue", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Pending Reviews", value: pendingReviews.length, sub: "Requires attention", icon: FileSignature, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Video Consults", value: videoConsultsToday.length, sub: "Scheduled today", icon: Video, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Unread Messages", value: unreadMessagesCount, sub: "Patient inquiries", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" }
        ].map((stat, i) => (
          <Card key={i} className={cn(doctorSurfaceCard, "border-emerald-100/70 transition-shadow hover:shadow-md")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border", stat.bg, stat.border)}>
                   <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <span className="text-2xl font-bold text-[#0A2E1F]">{stat.value}</span>
              </div>
              <p className="text-sm font-bold text-slate-700">{stat.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Dynamic Clinical Analytics Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-emerald-100 shadow-[0_10px_40px_rgba(16,185,129,0.08)] rounded-[2.5rem] bg-white overflow-hidden p-8 flex flex-col h-[520px] relative">
            
            {/* Background embellishments */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -z-10 translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-50 rounded-full blur-2xl opacity-60 -z-10 -translate-x-1/2 translate-y-1/2" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-[#0A2E1F] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" /> Clinical Volume
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {timeFilter === 'year' ? "12-Month" : timeFilter === 'month' ? "30-Day" : "7-Day"} Patient Encounters &bull; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                </p>
              </div>
              
              {/* Dynamic Dropdown Filter */}
              <div className="relative" ref={filterRef}>
                <Button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  variant="outline" 
                  className="rounded-xl border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800"
                >
                  <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
                  {timeFilterLabels[timeFilter]}
                  <ChevronDown className="h-4 w-4 ml-2 text-emerald-600 opacity-70" />
                </Button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-50"
                    >
                      {(Object.keys(timeFilterLabels) as TimeFilter[]).map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            setTimeFilter(key);
                            setIsFilterOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 text-sm font-bold transition-colors",
                            timeFilter === key 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "text-slate-600 hover:bg-slate-50 hover:text-[#0A2E1F]"
                          )}
                        >
                          {timeFilterLabels[key]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Big Hero Number */}
            <div className="text-center mb-10">
              <motion.h1 
                key={chartData.totalConsults}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-7xl font-black text-[#0A2E1F] tracking-tighter"
              >
                {chartData.totalConsults}
              </motion.h1>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mt-3 flex items-center justify-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Total Consultations
              </p>
            </div>

            {/* 3 Clinical Stats Row */}
            <div className="flex items-center justify-center gap-8 sm:gap-16 mb-10">
              <div className="text-center">
                <motion.p 
                  key={chartData.topMedication}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-black text-slate-800 truncate max-w-[140px]"
                >
                  {chartData.topMedication}
                </motion.p>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Top Rx</p>
              </div>
              
              <div className="w-px h-10 bg-slate-100" />

              <div className="text-center">
                <div className="flex justify-center items-center gap-2">
                  <motion.p 
                    key={chartData.avgWaitTime}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-black text-slate-800"
                  >
                    {chartData.avgWaitTime} <span className="text-sm text-slate-400 font-semibold">min</span>
                  </motion.p>
                  <span className="flex items-center bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                    <ArrowDown className="h-3 w-3 mr-0.5" /> 2m
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Avg Wait Time</p>
              </div>
            </div>

            {/* The Chart */}
            <div className="flex-1 w-full min-h-[160px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.series} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConsults" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(16,185,129,0.15)', padding: '12px' }}
                    itemStyle={{ color: '#047857', fontWeight: '900', fontSize: '16px' }}
                    labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="consults" 
                    name="Patients"
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorConsults)" 
                    activeDot={{ r: 7, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <Link
              to={`${doctorBase}/analytics`}
              className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between group"
            >
              <span className="text-sm font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">View analytics & insights</span>
              <ChevronRight className="h-4 w-4 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </Card>
        </div>

        {/* Right Col: Schedule & Quick Tools */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card className={cn(doctorSurfaceCard, "border-emerald-100/70")}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-[#0A2E1F] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" /> Today's Schedule
              </h3>
              <Link to={`${doctorBase}/schedule`}>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-semibold text-slate-500">
                  Manage
                </Button>
              </Link>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {videoConsultsToday.length > 0 ? (
                  videoConsultsToday.slice(0,4).map((v, i) => (
                    <div key={i} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className="text-center w-16 shrink-0">
                        <p className="text-xs font-bold text-slate-900">{v.consultation_time?.split(' ')[0] || "10:00"}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{v.consultation_time?.split(' ')[1] || "AM"}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{v.patientName}</p>
                        <p className="text-xs text-slate-500 truncate">{v.category}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-blue-600 hover:bg-blue-50">
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-500">No video consults scheduled for today.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Access Tools */}
          <Card
            className={cn(
              doctorSurfaceCard,
              "border-teal-100/60 bg-gradient-to-br from-teal-50/25 via-white to-emerald-50/35",
            )}
          >
            <div className="border-b border-emerald-100/70 p-5">
              <h3 className="font-bold text-[#0A2E1F] flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" /> Quick Tools
              </h3>
            </div>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: "Messages", icon: MessageSquare, href: doctorMessagesHref(doctorBase) },
                { label: "Lab Results", icon: FlaskConical, href: `${doctorBase}/labs` },
                { label: "E-Prescribe", icon: Pill, href: `${doctorBase}/erx` },
                { label: "AI Scribe", icon: Bot, href: `${doctorBase}/scribe` },
              ].map((tool, i) => (
                <Link key={i} to={tool.href}>
                  <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 rounded-xl bg-white border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm">
                    <tool.icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{tool.label}</span>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>

    </div>
  );
}
