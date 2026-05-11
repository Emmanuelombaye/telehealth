import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, Video, ChevronRight, Plus, Loader2, CalendarPlus, CheckCircle2, AlertCircle, Activity, ShieldCheck, UserCircle, Send, Circle, Database } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";
import { supabase } from "../../../../lib/supabaseClient";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function DoctorSchedulePage() {
  const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleTimes, setRescheduleTimes] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const navigate = useNavigate();
  const availabilityRef = useRef<HTMLDivElement>(null);

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('zoom_status', 'is', null)
        .neq('zoom_status', 'not_requested')
        .neq('zoom_status', 'canceled')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setScheduledOrders(data || []);
    } catch (err) {
      console.error("Schedule fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    const channel = supabase.channel('doctor-schedule-watch-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchSchedule();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleConfirm = async (id: string, orderNumber: string) => {
    setIsUpdating(id);
    try {
      // Optimistic Update
      setScheduledOrders(prev => prev.map(o => o.id === id ? { ...o, zoom_status: 'confirmed' } : o));
      
      const { error } = await supabase
        .from('orders')
        .update({ zoom_status: 'confirmed' })
        .eq('order_number', orderNumber);
      if (error) throw error;
      
      toast.success("Session confirmed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to confirm session.");
      fetchSchedule(); // Revert on error
    } finally {
      setIsUpdating(null);
    }
  };

  const handleReschedule = async (id: string, orderNumber: string) => {
    const time = rescheduleTimes[id];
    if (!time) {
      toast.error("Please enter a proposed time.");
      return;
    }
    
    setIsUpdating(id);
    try {
      // Optimistic Update
      setScheduledOrders(prev => prev.map(o => o.id === id ? { ...o, zoom_status: 'rescheduled', zoom_rescheduled_time: time } : o));

      const { error } = await supabase
        .from('orders')
        .update({ 
          zoom_status: 'rescheduled',
          zoom_rescheduled_time: time 
        })
        .eq('order_number', orderNumber);
      if (error) throw error;
      
      toast.success("Reschedule request sent to patient.");
      setRescheduleTimes(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reschedule request.");
      fetchSchedule(); // Revert
    } finally {
      setIsUpdating(null);
    }
  };

  const scrollToAvailability = () => {
    availabilityRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              Active Video Logistics
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#0A2E1F] tracking-tight uppercase">
            Clinical Schedule
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-2">
            Manage your daily consultations and sync your availability matrix.
          </p>
        </div>
        
        <Button 
          onClick={scrollToAvailability}
          className="relative z-10 h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20 gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <CalendarPlus className="h-4 w-4" /> 
          Update Availability
        </Button>
      </div>
      
      {/* MAIN CONTENT GRID */}
      <div className="grid xl:grid-cols-12 gap-8">
        
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-lg font-black text-[#0A2E1F] tracking-tight uppercase">Upcoming Sessions</h3>
             <Badge variant="outline" className="text-[10px] font-bold tracking-widest bg-white border-slate-200 text-slate-500 px-3 py-1">
               {scheduledOrders.length} {scheduledOrders.length === 1 ? 'Action' : 'Actions'} Pending
             </Badge>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] shadow-sm border border-slate-100"
              >
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Syncing Matrix...</p>
              </motion.div>
            ) : scheduledOrders.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[2rem]">
                  <CardContent className="p-24 text-center">
                    <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                      <Calendar className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No Active Consultations</p>
                    <p className="text-slate-400 text-xs mt-2">Your queue is clear.</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="show"
                className="space-y-4"
              >
                {scheduledOrders.map((s) => {
                  const timeDisplay = s.zoom_rescheduled_time || s.consultation_time || "Pending Time";
                  const isConfirmed = s.zoom_status === "confirmed";
                  const isRequested = s.zoom_status === "requested";
                  const isRescheduled = s.zoom_status === "rescheduled";

                  return (
                    <motion.div key={s.id} variants={itemVariants}>
                      <Card className={cn(
                        "transition-all duration-300 border border-slate-200 shadow-sm rounded-[1.5rem] overflow-hidden group hover:shadow-lg bg-white relative",
                        isConfirmed ? "border-l-4 border-l-emerald-500" : isRequested ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-blue-400"
                      )}>
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            
                            {/* TIME MODULE */}
                            <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center text-center shrink-0 lg:w-32 lg:border-r border-slate-100 lg:pr-6 bg-slate-50 lg:bg-transparent p-4 lg:p-0 rounded-xl lg:rounded-none">
                              <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center lg:mb-3 shadow-sm",
                                isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-white border border-slate-200 text-slate-500"
                              )}>
                                <Clock className="h-5 w-5" />
                              </div>
                              <div className="text-right lg:text-center">
                                <p className="text-sm font-black text-[#0A2E1F] uppercase tracking-tight">{timeDisplay.split(' ')[0]}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{timeDisplay.split(' ').slice(1).join(' ')}</p>
                              </div>
                            </div>

                            {/* PATIENT INFO */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5">
                                <h4 className="font-bold text-lg text-[#0A2E1F]">{s.patient_name || "Unknown Patient"}</h4>
                                <Badge variant="outline" className={cn(
                                  "text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 border",
                                  isConfirmed ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : isRequested ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                )}>
                                  {isConfirmed ? "Confirmed" : isRequested ? "Action Required" : "Pending Patient"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 mb-3">
                                 <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{s.category || "Treatment"}</span>
                                 <span className="truncate">{s.medication}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Database className="h-3 w-3" />
                                <span>Matrix ID: #{s.order_number}</span>
                              </div>
                            </div>

                            {/* ACTION MODULE */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 lg:pt-0 lg:border-l-0 border-t border-slate-100 mt-4 lg:mt-0 lg:pl-6 w-full lg:w-auto">
                              
                              {(isRequested || isRescheduled) && (
                                <div className="flex w-full sm:w-auto items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                                  <input 
                                    type="text"
                                    placeholder="Propose time..."
                                    className="h-9 px-3 bg-transparent text-xs font-medium outline-none w-full sm:w-32 placeholder:text-slate-400"
                                    value={rescheduleTimes[s.id] || ""}
                                    onChange={e => setRescheduleTimes(prev => ({ ...prev, [s.id]: e.target.value }))}
                                  />
                                  <Button 
                                    size="icon" 
                                    className="h-9 w-9 shrink-0 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 shadow-sm"
                                    onClick={() => handleReschedule(s.id, s.order_number)}
                                    disabled={isUpdating === s.id}
                                    title="Send Reschedule Request"
                                  >
                                    {isUpdating === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                  </Button>
                                </div>
                              )}

                              {isRequested && (
                                <Button 
                                  className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                  onClick={() => handleConfirm(s.id, s.order_number)}
                                  disabled={isUpdating === s.id}
                                >
                                  {isUpdating === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                                </Button>
                              )}
                              
                              {isConfirmed && (
                                <Button 
                                  className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#0A2E1F] hover:bg-[#0d3f2a] text-white font-bold text-xs shadow-lg shadow-[#0A2E1F]/20 gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                  onClick={() => navigate(`/doctor/consult?orderId=${s.order_number}`)}>
                                  <Video className="h-4 w-4" /> 
                                  Join Room
                                </Button>
                              )}

                              {isRescheduled && (
                                 <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                                    <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Awaiting Patient</span>
                                 </div>
                              )}
                            </div>

                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="xl:col-span-4 space-y-6">
           <Card className="border-none shadow-xl shadow-emerald-900/10 rounded-[2rem] bg-gradient-to-br from-[#0A2E1F] to-[#062015] text-white p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 blur-[60px] rounded-full -mr-20 -mt-20 group-hover:bg-emerald-400/30 transition-colors duration-700"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                <h3 className="text-base font-black tracking-widest uppercase text-emerald-50">Clinical Matrix</h3>
              </div>

              <div className="space-y-4 relative z-10">
                 {[
                   { label: "Identity Verification", status: "Validated", icon: UserCircle },
                   { label: "Telemetry Sync", status: "Active", icon: Activity },
                   { label: "Encrypted Stream", status: "Secured", icon: ShieldCheck },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                         <item.icon className="h-4 w-4 text-emerald-400" />
                         <span className="text-xs font-semibold text-emerald-50/80">{item.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{item.status}</span>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="p-8 rounded-[2rem] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-black text-[#0A2E1F] uppercase tracking-widest mb-6 flex items-center justify-between">
                Network Utilization
                <Activity className="h-4 w-4 text-slate-400" />
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-xs font-bold text-slate-500 uppercase">Current Load</p>
                    <p className="text-xl font-black text-emerald-600">84%</p>
                 </div>
                 <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '84%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" 
                    />
                 </div>
              </div>
           </Card>
        </div>

      </div>

      {/* CALENDLY MANAGEMENT SECTION */}
      <div className="pt-16 border-t border-slate-200" ref={availabilityRef}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-[1rem] bg-emerald-50 shadow-inner border border-emerald-100 flex items-center justify-center">
              <CalendarPlus className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0A2E1F] uppercase tracking-tight">Availability Engine</h2>
              <p className="text-xs font-bold text-slate-500 mt-1">Manage global consultation slots.</p>
            </div>
          </div>
          <Badge variant="outline" className="px-4 py-2 bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[10px] font-bold gap-2">
            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" /> Live Sync
          </Badge>
        </div>
        
        <Card className="overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white">
          <iframe 
            src={`https://calendly.com/calendly-demo?hide_event_type_details=1&hide_gdpr_banner=1&primary_color=0a2e1f`} 
            width="100%" 
            height="750" 
            frameBorder="0" 
            title="Calendly Scheduling"
            className="w-full bg-white"
          />
        </Card>
      </div>

    </div>
  );
}

