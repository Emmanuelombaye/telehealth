import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, Video, ChevronRight, Plus, Loader2, CalendarPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";
import { supabase } from "../../../../lib/supabaseClient";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

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
        console.log("Real-time update detected in Schedule");
        fetchSchedule();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleConfirm = async (id: string) => {
    setIsUpdating(id);
    try {
      // Optimistic Update
      setScheduledOrders(prev => prev.map(o => o.id === id ? { ...o, zoom_status: 'confirmed' } : o));
      
      const { error } = await supabase
        .from('orders')
        .update({ zoom_status: 'confirmed' })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      fetchSchedule(); // Revert on error
    } finally {
      setIsUpdating(null);
    }
  };

  const handleReschedule = async (id: string) => {
    const time = rescheduleTimes[id];
    if (!time) return;
    
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
        .eq('id', id);
      if (error) throw error;
      
      setRescheduleTimes(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error(err);
      fetchSchedule(); // Revert
    } finally {
      setIsUpdating(null);
    }
  };

  const scrollToAvailability = () => {
    availabilityRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              Clinical Logistics
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#0A2E1F] tracking-tighter uppercase italic">
            Patient <span className="text-emerald-600 font-serif font-normal lowercase">Schedule</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
            Manage Video Consultations & Real-time Bookings
          </p>
        </div>
        
        <Button 
          onClick={scrollToAvailability}
          className="h-14 px-8 rounded-2xl bg-[#0A2E1F] text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-900/10 gap-3 group"
        >
          <CalendarPlus className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
          Add Availability
        </Button>
      </div>
      
      {/* MAIN CONTENT GRID */}
      <div className="grid lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xl font-black text-[#0A2E1F] tracking-tight uppercase">Upcoming Sessions</h3>
             <Badge variant="outline" className="text-[9px] font-black tracking-widest bg-white">
               {scheduledOrders.length} Pending Actions
             </Badge>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] shadow-2xl shadow-slate-100/50 border border-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing Clinical Ledger...</p>
              </div>
            ) : scheduledOrders.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[3rem]">
                  <CardContent className="p-24 text-center">
                    <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Calendar className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] italic">No active consultations in queue.</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              scheduledOrders.map((s, idx) => {
                const timeDisplay = s.zoom_rescheduled_time || s.consultation_time || "Time Pending";
                const isConfirmed = s.zoom_status === "confirmed";
                const isRequested = s.zoom_status === "requested";
                const isRescheduled = s.zoom_status === "rescheduled";

                return (
                  <motion.div 
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      "transition-all border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:shadow-emerald-900/5 bg-white relative",
                      isConfirmed && "bg-emerald-50/10 ring-1 ring-emerald-100/50"
                    )}>
                      <CardContent className="p-8">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-10">
                          {/* TIME MODULE */}
                          <div className="flex flex-col items-center justify-center text-center shrink-0 w-32 border-r border-slate-50 pr-10">
                            <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm border",
                              isConfirmed ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                            )}>
                              <Clock className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-black text-[#0A2E1F] uppercase tracking-tighter italic">{timeDisplay.split(' ')[0]}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{timeDisplay.split(' ').slice(1).join(' ')}</p>
                          </div>

                          {/* PATIENT INFO */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-black text-lg text-[#0A2E1F] uppercase tracking-tight">{s.patient_name || "Specimen Unidentified"}</h4>
                              <Badge className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-none px-3 py-1",
                                isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-600"
                              )}>
                                {s.zoom_status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                               <span className="flex items-center gap-1.5"><Badge variant="outline" className="text-[8px] bg-slate-50">{s.category || "General"}</Badge></span>
                               <span className="truncate">{s.medication}</span>
                            </div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-4 italic">ORDER MATRIX: #{s.order_number}</p>
                          </div>

                          {/* ACTION MODULE */}
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            {(isRequested || isRescheduled) && (
                              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                <input 
                                  type="text"
                                  placeholder="Propose New Time..."
                                  className="h-10 px-4 bg-white rounded-xl text-[10px] font-bold outline-none focus:ring-2 ring-emerald-500/20 border-none w-40"
                                  value={rescheduleTimes[s.id] || ""}
                                  onChange={e => setRescheduleTimes(prev => ({ ...prev, [s.id]: e.target.value }))}
                                />
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600"
                                  onClick={() => handleReschedule(s.id)}
                                  disabled={isUpdating === s.id}
                                >
                                  {isUpdating === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reschedule"}
                                </Button>
                              </div>
                            )}

                            {isRequested && (
                              <Button 
                                size="sm" 
                                className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20"
                                onClick={() => handleConfirm(s.id)}
                                disabled={isUpdating === s.id}
                              >
                                {isUpdating === s.id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Session"}
                              </Button>
                            )}
                            
                            {isConfirmed && (
                              <Button 
                                className="h-16 px-10 rounded-3xl bg-[#0A2E1F] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-emerald-900/20 gap-3 group"
                                onClick={() => navigate(`/doctor/consult?orderId=${s.order_number}`)}>
                                <Video className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
                                Join Command Suite
                              </Button>
                            )}

                            {isRescheduled && (
                               <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-amber-50 border border-amber-100">
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Waiting for Patient Confirmation</span>
                               </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* SIDEBAR / HELP SECTION */}
        <div className="lg:col-span-4 space-y-10">
           <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-[#0A2E1F] text-white p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full -mr-20 -mt-20"></div>
              <h3 className="text-xl font-black tracking-tight uppercase mb-6 italic">Clinical Protocol</h3>
              <div className="space-y-6">
                 {[
                   { label: "Patient Verification", status: "Required", icon: CheckCircle2 },
                   { label: "Vitals Sync", status: "Active", icon: Activity },
                   { label: "Encrypted Line", status: "Secure", icon: ShieldCheck },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                         <item.icon className="h-4 w-4 text-emerald-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{item.label}</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase">{item.status}</span>
                   </div>
                 ))}
              </div>
           </Card>

           <div className="p-10 rounded-[3rem] border border-slate-100 bg-white shadow-xl shadow-slate-100/50">
              <h3 className="text-lg font-black text-[#0A2E1F] uppercase tracking-tight mb-4">Availability Stats</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization Rate</p>
                    <p className="text-2xl font-black text-emerald-600 italic">84%</p>
                 </div>
                 <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '84%' }} />
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* CALENDLY MANAGEMENT SECTION */}
      <div className="pt-20 border-t border-slate-100" ref={availabilityRef}>
        <div className="flex items-center gap-4 mb-10">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
            <CalendarPlus className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#0A2E1F] tracking-tighter uppercase italic">Manage Availability</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Calendar Integration Engine</p>
          </div>
        </div>
        
        <Card className="overflow-hidden border-none shadow-3xl shadow-slate-200/60 rounded-[4rem] bg-white">
          <div className="p-2 bg-[#0A2E1F] flex items-center justify-center gap-4">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-white uppercase tracking-[0.5em]">Authorized Scheduling Interface</span>
          </div>
          <iframe 
            src={`https://calendly.com/calendly-demo?hide_event_type_details=1&hide_gdpr_banner=1&primary_color=0a2e1f`} 
            width="100%" 
            height="750" 
            frameBorder="0" 
            title="Calendly Scheduling"
            className="w-full bg-white rounded-b-[4rem]"
          />
        </Card>
      </div>

    </div>
  );
}

