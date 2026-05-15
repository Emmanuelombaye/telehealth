import { useState, useEffect } from "react";
import {
  Users, Calendar, Clock, Search, Filter, MoreVertical,
  Video, FileText, MessageSquare, TrendingUp, UserCheck,
  ChevronRight, Activity, HeartPulse, Zap,
  Bell, Command, ShieldCheck, Database, Layers, ArrowUpRight,
  Sparkles, FlaskConical, Bot, Pill, CheckCircle2, AlertCircle, FileSignature
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, cn } from "../../components/ui/shared.tsx";
import { DoctorClinicalFlowMap } from "../../components/doctor/DoctorClinicalFlowMap";
import { DoctorPageHeader } from "../../components/doctor/DoctorPageHeader";
import { getOrderVideoRail } from "../../../lib/orderVideoRail";
import { doctorPageContainer, doctorSurfaceCard } from "../../../lib/doctorPortalUi";
import { useI18n, getGreeting, usePatientStore, useAuthStore } from "../../../lib";
import { useDoctorPortalBase } from "../../../lib/doctorPortalBase";
import { Link, useNavigate } from "react-router";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;

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

  // Metrics
  const todayStr = new Date().toDateString();
  
  const pendingConsults = orders.filter(o => {
    const isActive = o.status === "order_submitted" || o.status === "medical_review" || o.status === "rx_sent";
    const needsRefill = o.nextRefillAt && new Date(o.nextRefillAt) <= new Date();
    return isActive || needsRefill;
  });
  
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

      {/* 2. CLINICAL METRICS (4 Columns) */}
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
        
        {/* Left Col: Active Patient Queue (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(doctorSurfaceCard, "flex h-full flex-col overflow-hidden border-emerald-100/70")}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Activity className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-[#0A2E1F]">Clinical Action Queue</h2>
              </div>
              <Link to={`${doctorBase}/queue`}>
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
                    <th className="text-left py-3 px-5 font-semibold text-slate-500">Visit path</th>
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
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ 
                          backgroundColor: "rgba(16, 185, 129, 0.04)",
                          transition: { duration: 0.2 }
                        }}
                        className="relative transition-colors group cursor-pointer border-l-2 border-transparent hover:border-emerald-500 overflow-hidden"
                        onClick={() => navigate(`${doctorBase}/consult?orderId=${order.id}`)}
                      >
                        {/* THE SCANNING BEAMS */}
                        <motion.div 
                          className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 z-20 pointer-events-none"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                        <motion.div 
                          className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 z-20 pointer-events-none"
                          initial={{ x: "100%" }}
                          whileHover={{ x: "-100%" }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />

                        <td className="py-4 px-5 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className={cn(
                                "h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs transition-all duration-500 group-hover:bg-[#0A2E1F] group-hover:text-emerald-400 group-hover:rotate-[12deg]",
                                order.urgent && "ring-2 ring-red-500 ring-offset-2"
                              )}>
                                {order.patientName?.charAt(0) || "U"}
                              </div>
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" 
                              />
                            </div>
                            <div>
                              <p className="font-black text-sm text-[#0A2E1F] tracking-tight">{order.patientName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{order.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 relative z-10">
                          <p className="font-black text-xs text-slate-700">{order.medication}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{order.category}</p>
                        </td>
                        <td className="py-4 px-5 relative z-10">
                          {(() => {
                            const rail = getOrderVideoRail(order);
                            return (
                              <span
                                title={rail.sub}
                                className={cn(
                                  "inline-flex max-w-[140px] rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                                  rail.kind === "async" &&
                                    "bg-slate-100 text-slate-600 group-hover:bg-white/20 group-hover:text-emerald-50",
                                  rail.kind === "enrollment_video" &&
                                    "bg-violet-100 text-violet-800 group-hover:bg-white/15 group-hover:text-emerald-50",
                                  rail.kind === "doctor_requested_video" &&
                                    "bg-amber-100 text-amber-900 group-hover:bg-white/15 group-hover:text-emerald-50",
                                  rail.kind === "video_confirmed" &&
                                    "bg-emerald-100 text-emerald-900 group-hover:bg-white/20 group-hover:text-emerald-950",
                                )}
                              >
                                {rail.badge}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-5 relative z-10">
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase tracking-[0.15em] border-none px-3 py-1 rounded-lg",
                            order.status === 'medical_review' ? "bg-amber-100 text-amber-700" :
                            order.status === 'order_submitted' ? "bg-blue-100 text-blue-700" :
                            "bg-emerald-100 text-emerald-700"
                          )}>
                            {order.status?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-5 relative z-10">
                           <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                             <Clock className="h-3 w-3 text-emerald-500" />
                             {new Date(order.orderedDate || order.ordered_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </td>
                        <td className="py-4 px-5 text-right relative z-10">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              size="sm" 
                              className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#0A2E1F] text-white hover:bg-emerald-900 shadow-sm group-hover:shadow-emerald-900/20 transition-all border-none"
                            >
                              Review
                            </Button>
                          </motion.div>
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
                { label: "Messages", icon: MessageSquare, href: `${doctorBase}/messages` },
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

