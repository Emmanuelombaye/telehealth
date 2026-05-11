import { useState, useEffect, useMemo } from "react";
import {
  Users, Calendar, Clock, Search, Filter, MoreVertical,
  Video, FileText, MessageSquare, TrendingUp, UserCheck,
  ChevronRight, Activity, HeartPulse, Stethoscope, Zap,
  Bell, Command, ShieldCheck, Database, Layers, ArrowUpRight,
  Sparkles, FlaskConical, Bot, Pill, CheckCircle2, AlertCircle, FileSignature
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, cn } from "../../components/ui/shared.tsx";
import { useI18n, getGreeting, usePatientStore, useAuthStore } from "../../../lib";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

export function DoctorDashboard() {
  const { t } = useI18n();
  const greeting = getGreeting(t);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const user = useAuthStore(state => state.user);
  const doctorName = user?.user_metadata?.first_name
    ? `Dr. ${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : "Dr. Clinical Provider";

  const { orders, fetchOrders, subscribeToOrders } = usePatientStore();

  // Metrics
  const pendingConsults = orders.filter(o => {
    const isActive = o.status === "order_submitted" || o.status === "medical_review" || o.status === "rx_sent";
    const needsRefill = o.nextRefillAt && new Date(o.nextRefillAt) <= new Date();
    return isActive || needsRefill;
  });
  
  const videoConsults = orders.filter(o => o.zoom_status === "confirmed" || o.zoom_status === "requested");
  const pendingReviews = orders.filter(o => o.status === "medical_review" || o.status === "order_submitted");
  const patientsToday = pendingConsults.length;

  useEffect(() => {
    const unsubscribe = subscribeToOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [subscribeToOrders]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-700">
      
      {/* 1. PROFESSIONAL HEADER */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5 min-w-0 w-full xl:w-auto flex-1">
          <div className="h-14 w-14 rounded-xl bg-[#0A2E1F] flex items-center justify-center shadow-md shrink-0">
             <Stethoscope className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A2E1F] truncate">
              {greeting}, {doctorName}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 whitespace-nowrap">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Session
              </span>
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap hidden sm:inline-block">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold gap-2 whitespace-nowrap flex-1 sm:flex-none">
            <Search className="h-4 w-4 shrink-0" /> Find Patient
          </Button>
          <Link to="/doctor/consult" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto h-10 px-5 rounded-xl bg-[#0A2E1F] hover:bg-[#153e2d] text-white font-semibold gap-2 shadow-md whitespace-nowrap">
              <Video className="h-4 w-4 shrink-0" /> Join Consult Suite
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. CLINICAL METRICS (4 Columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Patients Today", value: patientsToday, sub: "In active queue", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Pending Reviews", value: pendingReviews.length, sub: "Requires attention", icon: FileSignature, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Video Consults", value: videoConsults.length, sub: "Scheduled today", icon: Video, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Unread Messages", value: "3", sub: "Patient inquiries", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" }
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-200 rounded-[1.25rem] shadow-sm hover:shadow-md transition-all">
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
        
        {/* Left Col: Active Patient Queue (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Activity className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-[#0A2E1F]">Clinical Action Queue</h2>
              </div>
              <Link to="/doctor/queue">
                <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-5 font-semibold text-slate-500">Patient</th>
                    <th className="text-left py-3 px-5 font-semibold text-slate-500">Treatment</th>
                    <th className="text-left py-3 px-5 font-semibold text-slate-500">Status</th>
                    <th className="text-left py-3 px-5 font-semibold text-slate-500">Time</th>
                    <th className="text-right py-3 px-5 font-semibold text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {pendingConsults.slice(0, 7).map((order, i) => (
                      <motion.tr 
                        key={order.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                              {order.patientName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{order.patientName}</p>
                              <p className="text-[10px] text-slate-500 uppercase">{order.order_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <p className="font-medium text-slate-700">{order.medication}</p>
                          <p className="text-xs text-slate-500">{order.category}</p>
                        </td>
                        <td className="py-3 px-5">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider border",
                            order.status === 'medical_review' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            order.status === 'order_submitted' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}>
                            {order.status?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-5 text-xs font-medium text-slate-600">
                          {new Date(order.orderedDate || order.ordered_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <Button 
                            size="sm" 
                            className="h-8 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                            onClick={() => navigate(`/doctor/consult?orderId=${order.order_number}`)}
                          >
                            Review
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {pendingConsults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-200 mb-3" />
                  <p className="text-sm font-semibold text-slate-600">Queue is Clear</p>
                  <p className="text-xs text-slate-500 mt-1">All pending items have been reviewed.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Schedule & Quick Tools */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card className="border border-slate-200 rounded-[1.5rem] shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-[#0A2E1F] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" /> Today's Schedule
              </h3>
              <Link to="/doctor/schedule">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-semibold text-slate-500">
                  Manage
                </Button>
              </Link>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {videoConsults.length > 0 ? (
                  videoConsults.slice(0,4).map((v, i) => (
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
          <Card className="border border-slate-200 rounded-[1.5rem] shadow-sm bg-slate-50/50">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-[#0A2E1F] flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" /> Quick Tools
              </h3>
            </div>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: "Messages", icon: MessageSquare, href: "/doctor/messages" },
                { label: "Lab Results", icon: FlaskConical, href: "/doctor/labs" },
                { label: "E-Prescribe", icon: Pill, href: "/doctor/erx" },
                { label: "AI Scribe", icon: Bot, href: "/doctor/scribe" }
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

