import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Calendar, Clock, FileText, Activity, MessageSquare, Plus,
  Droplets, Heart, ChevronRight, Video, Pill, Stethoscope,
  ShieldCheck, TrendingUp, Truck, CheckCircle2, Package, ShoppingBag, Hourglass, Building2, Copy, RefreshCw
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, cn } from "../../components/ui/shared.tsx";
import {
  useI18n,
  ORDER_STEPS, getStepIndex, usePatientStore, useAuthStore
} from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";

const stepIcon: Record<string, any> = {
  order_submitted: FileText,
  account_created: CheckCircle2,
  id_verified: ShieldCheck,
  intake_completed: Activity,
  medical_review: Stethoscope,
  rx_sent: Pill,
  shipped: Package,
  delivered: Truck,
  refill_eligible: RefreshCw,
};

const subBrandTint: Record<string, string> = {
  GlowRx: "bg-emerald-50 text-emerald-700 border-emerald-100",
  VitalCare: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PeakHealth: "bg-[#0A2E1F] text-white border-[#0A2E1F]/10",
};

export function PatientDashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const doctorAvailability = usePatientStore(state => state.doctorAvailability);
  const firstName = user?.user_metadata?.first_name || 'Patient';
  const availableDoctors = doctorAvailability.filter(d => d.available);

  const { orders, fetchOrders, subscribeToOrders } = usePatientStore();
  const [activeConsult, setActiveConsult] = useState<any>(null);
  
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      const unsubscribe = subscribeToOrders();
      return () => unsubscribe();
    }
  }, [user?.id, fetchOrders, subscribeToOrders]);

  // Real-time subscription: detect when doctor goes live
  useEffect(() => {
    if (!user?.id) return;

    // Check immediately on load
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('consultation_live', true)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setActiveConsult(data[0]);
      });

    const channel = supabase
      .channel('patient_dashboard_consult')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.consultation_live) {
          setActiveConsult(updated);
        } else {
          setActiveConsult(prev => prev?.id === updated.id ? null : prev);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const awaitingReview = orders.filter(o => o.status === "order_submitted").length;

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-1000 pb-10">

      {/* ── LIVE CONSULTATION ALERT BANNER ── */}
      {activeConsult && (
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-[2rem] p-1 shadow-2xl shadow-emerald-900/30 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-[#0A2E1F] rounded-[1.75rem] px-8 py-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0 relative">
                <Video className="h-7 w-7 text-emerald-400" />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-[#0A2E1F] animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Action Required</p>
                <p className="text-xl font-black text-white tracking-tight">Your Doctor Is Live Now</p>
                <p className="text-xs text-emerald-300/70 font-medium mt-0.5">
                  {activeConsult.doctor || 'Your physician'} is waiting in the secure consultation room
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/patient/consult')}
              className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl px-8 h-13 py-4 font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-900/30 transition-all hover:scale-105 flex items-center gap-3 whitespace-nowrap"
            >
              <Video className="h-5 w-5" /> Join Consultation
            </button>
          </div>
        </div>
      )}


      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-50">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0A2E1F]">
              Welcome, <span className="font-serif italic font-normal text-emerald-600">{firstName}</span>
            </h1>
            {orders[0]?.mrn && (
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-black border-none text-[10px]">
                MRN: {orders[0].mrn}
              </Badge>
            )}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            Clinical Logistics & Fulfillment Dashboard
          </p>
        </div>
        <Link to="/patient/appointments">
          <Button className="rounded-[2rem] h-16 px-10 shadow-2xl shadow-emerald-900/10 gap-3 group bg-[#0A2E1F]">
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            {t("action.bookVisit")}
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Fulfillment Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-[#0A2E1F] uppercase tracking-[0.3em]">Active Prescriptions</h2>
            <Badge variant="outline" className="text-[9px] font-black border-slate-100 text-slate-400">{orders.length} TOTAL</Badge>
          </div>

          {orders.map(order => {
            const currentIdx = getStepIndex(order.status);
            const tint = subBrandTint[order.subBrand] ?? subBrandTint.PeakHealth;
            const statusLabel = ORDER_STEPS[currentIdx]?.label ?? "Processing";

            return (
              <Card key={order.id} className="group hover:shadow-3xl transition-all duration-700 hover:-translate-y-1 overflow-hidden border-none shadow-xl shadow-slate-200/40">
                <CardContent className="p-10">
                  <div className="flex items-start justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5 min-w-0">
                       <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-[#0A2E1F] shadow-inner shrink-0">
                          <Pill size={32} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-1">{order.subBrand}</p>
                          <p className="text-2xl font-black text-[#0A2E1F] tracking-tight truncate">{order.medication}</p>
                       </div>
                    </div>
                    <Badge className={cn("px-6 py-2 rounded-2xl font-black text-[10px] tracking-widest border shrink-0 shadow-sm", tint)}>
                      {statusLabel.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 pb-10 border-b border-slate-50">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 truncate">Dosage Sig</p>
                      <p className="text-sm font-bold text-[#0A2E1F] truncate">{order.dosageInstructions}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 truncate">Physician</p>
                      <p className="text-sm font-bold text-[#0A2E1F] truncate">{order.doctor || 'Awaiting Assignment'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 truncate">Ordered On</p>
                      <p className="text-sm font-bold text-[#0A2E1F] truncate">{order.orderedDate}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 truncate">Next Refill</p>
                      <p className="text-sm font-black text-emerald-600 truncate">30 DAYS</p>
                    </div>
                  </div>

                  {/* ── VIDEO CALL REQUESTED ALERT ── */}
                  {order.zoom_status === 'requested' && (
                    <div className="mb-10 bg-amber-50/50 border border-amber-100 rounded-[2.5rem] p-10 shadow-inner">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="h-16 w-16 rounded-3xl bg-amber-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Video className="h-8 w-8 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.3em]">Clinical Action Required</p>
                          <p className="text-2xl font-black text-amber-900 tracking-tight">Video Consultation Requested</p>
                        </div>
                      </div>
                      <p className="text-base text-amber-800 font-medium leading-relaxed mb-8 italic opacity-90">
                        "{order.zoom_doctor_message || 'Your doctor would like to speak with you regarding your intake form before finalizing your prescription.'}"
                      </p>
                      <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-[1.5rem] h-16 font-black uppercase tracking-[0.2em] gap-3 shadow-xl shadow-amber-600/10">
                        <a href={`https://peakhealth.com/book/${order.doctor?.toLowerCase().replace('dr. ', '').replace(/ /g, '-')}`} target="_blank" rel="noopener noreferrer">
                          Secure Calendar Booking <Calendar className="h-5 w-5" />
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* High-Fidelity 5-step pipeline */}
                  <div className="relative pt-6 px-2">
                    <div className="absolute top-11 left-[8%] right-[8%] h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-[#0A2E1F] transition-all duration-1000 ease-out" 
                        style={{ width: `${(currentIdx / (ORDER_STEPS.length - 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                      {ORDER_STEPS.slice(0, 5).map((step, i) => {
                        const Icon = stepIcon[step.key];
                        const done = i <= currentIdx;
                        const active = i === currentIdx;
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-4 w-24">
                            <div className={cn(
                              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-2xl",
                              done ? "bg-[#0A2E1F] text-white scale-110 rotate-0" : "bg-white text-slate-200 border border-slate-50 scale-100",
                              active && "ring-8 ring-emerald-500/10"
                            )}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <p className={cn(
                              "text-[8px] font-black uppercase tracking-[0.2em] text-center leading-tight transition-all duration-500 w-full truncate px-1",
                              active ? "text-[#0A2E1F] opacity-100" : done ? "text-slate-400 opacity-80" : "text-slate-200 opacity-60"
                            )}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {orders.length === 0 && (
            <Card className="border-dashed border-4 border-slate-50 bg-slate-50/20">
              <CardContent className="p-24 text-center">
                <div className="h-32 w-32 rounded-[3rem] bg-emerald-50 flex items-center justify-center mx-auto mb-10 shadow-inner">
                  <ShoppingBag className="h-16 w-16 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tight mb-4">Begin Your Health Journey</h3>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] max-w-sm mx-auto leading-loose">
                  Explore our clinical treatment plans to start your professional care.
                </p>
                <Link to="/patient/shop" className="inline-block mt-12">
                  <Button className="rounded-[2rem] h-20 px-16 shadow-2xl shadow-emerald-900/10 text-base">
                    Browse Dispensary →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-10">
           {/* Doctor Strip */}
           <Card className="bg-[#0A2E1F] text-white overflow-hidden relative border-none shadow-2xl shadow-emerald-900/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full -mr-24 -mt-24 animate-pulse"></div>
              <CardHeader className="p-8">
                <div className="flex items-center justify-between mb-1">
                   <CardTitle className="text-white text-xl font-black tracking-tight">On-Call Staff</CardTitle>
                   <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-100/40">Real-time Clinical Availability</p>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                {availableDoctors.slice(0, 4).map(doc => (
                  <div key={doc.id} className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-5 group cursor-pointer hover:bg-white/10 transition-all duration-300">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center font-black text-emerald-400 text-xs shadow-inner">
                      {doc.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate">{doc.name}</p>
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-0.5">{doc.specialty}</p>
                    </div>
                    <ChevronRight size={18} className="text-white/10 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
                <Link to="/patient/appointments" className="block mt-4">
                   <Button variant="secondary" className="w-full h-14 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] border-none bg-emerald-500 text-white hover:bg-emerald-400">
                      View Medical Staff
                   </Button>
                </Link>
              </CardContent>
           </Card>

           {/* Security Banner */}
           <Card className="bg-emerald-50/50 border-emerald-100/50 shadow-none rounded-[2.5rem]">
              <CardContent className="p-8 flex items-center gap-5">
                <div className="h-14 w-14 rounded-3xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
                  <ShieldCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0A2E1F] uppercase tracking-[0.2em]">HIPAA Verified</p>
                  <p className="text-[9px] font-black text-emerald-600/50 uppercase tracking-[0.2em] mt-1">Authorized Data Ledger</p>
                </div>
              </CardContent>
           </Card>

           {/* Support Hub */}
           <div className="px-4">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6 text-center">Support Resources</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: MessageSquare, label: "Help Center" },
                  { icon: FileText, label: "Visit FAQ" },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-slate-50/30 border border-slate-50 hover:bg-white hover:shadow-xl transition-all group cursor-pointer">
                    <item.icon className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#0A2E1F]">{item.label}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
