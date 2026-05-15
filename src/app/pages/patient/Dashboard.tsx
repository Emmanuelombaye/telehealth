import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;
import {
  Calendar, Clock, FileText, Activity, MessageSquare, Plus,
  Droplets, Heart, ChevronRight, Video, Pill, Stethoscope,
  ShieldCheck, TrendingUp, Truck, CheckCircle2, Package, ShoppingBag, Hourglass, Building2, Copy, RefreshCw
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../components/ui/shared.tsx";
import {
  useI18n,
  ORDER_STEPS,
  getStepIndex,
  usePatientStore,
  useAuthStore,
  buildOrderFulfillmentRail,
  getOrderFulfillmentRailIndex,
} from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";

const stepIcon: Record<string, any> = {
  order_submitted: FileText,
  account_created: CheckCircle2,
  id_verified: ShieldCheck,
  intake_completed: Activity,
  medical_review: Stethoscope,
  consultation: Video,
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
  const firstName = user?.user_metadata?.first_name || 'Patient';
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
    <motion.div
      className="mx-auto max-w-6xl space-y-8 pb-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >

      {/* ── HIGH-FIDELITY LIVE CONSULTATION ALERT ── */}
      <AnimatePresence>
        {activeConsult && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="relative z-50 px-4"
          >
            <div className="bg-[#0A2E1F] rounded-[2.5rem] p-1 shadow-[0_20px_60px_rgba(16,185,129,0.3)] border border-emerald-500/20 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-transparent to-emerald-600/10 animate-pulse" />
              <div className="relative bg-[#0A2E1F] rounded-[2.25rem] px-8 py-7 flex flex-wrap items-center justify-between gap-6">
                
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 relative z-10 shadow-lg shadow-emerald-500/20">
                      <Video className="h-8 w-8 text-white" />
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-[3px] border-[#0A2E1F] flex items-center justify-center">
                         <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Live Connection Established</span>
                       <div className="h-1 w-1 rounded-full bg-emerald-500/30" />
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Secure Link Ready</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                      Doctor <span className="text-emerald-400">{activeConsult.doctor?.split(' ')[1] || 'Assigned'}</span> is Waiting
                    </h2>
                    <p className="text-sm font-medium text-emerald-100/50 mt-2 flex items-center gap-2">
                       <ShieldCheck className="h-4 w-4 text-emerald-500" /> End-to-end encrypted clinical session
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/patient/consult')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-[1.25rem] px-10 h-16 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group/btn"
                  >
                    Join Secure Consult <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Welcome + quick entry — modern glass, calm typography */}
      <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-6 shadow-[0_24px_80px_-32px_rgba(6,78,59,0.35)] ring-1 ring-emerald-900/[0.04] backdrop-blur-md sm:p-8 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(90%_70%_at_100%_20%,rgba(6,95,70,0.08),transparent_50%)]"
        />
        <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="mx-auto max-w-xl space-y-3 text-center sm:mx-0 sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-800/70">
              Peak Health · Patient · Step 9 of 9 (dashboard)
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.65rem] md:leading-[1.08]">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text font-medium text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
              Same nine-step care model after checkout: messages, visits (Cal.com / Calendly + Zoom / Meet), orders, and
              refills stay in this encrypted hub so you always know what happens next.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:w-auto lg:flex-col lg:items-stretch">
            <Link to="/patient/appointments" className="w-full sm:max-w-xs lg:max-w-none">
              <Button className="h-12 w-full rounded-2xl bg-[#0A2E1F] px-8 text-sm font-semibold shadow-lg shadow-emerald-900/15 transition hover:bg-[#0d3a28] sm:h-14">
                <Plus className="mr-2 h-4 w-4" />
                {t("action.bookVisit")}
              </Button>
            </Link>
            <Link
              to="/patient/shop"
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-emerald-200/80 bg-white/80 text-sm font-semibold text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 sm:max-w-xs lg:max-w-none"
            >
              <ShoppingBag className="mr-2 h-4 w-4 opacity-80" />
              Browse treatments
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/patient/shop", icon: ShoppingBag, label: "Shop", sub: "Plans" },
          { to: "/patient/messages", icon: MessageSquare, label: "Messages", sub: "Inbox" },
          { to: "/patient/labs", icon: Activity, label: "Labs", sub: "Results" },
          { to: "/patient/orders", icon: Truck, label: "Orders", sub: "Tracking" },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex flex-col rounded-2xl border border-emerald-100/80 bg-white/75 p-4 shadow-sm ring-1 ring-emerald-900/[0.03] transition hover:-translate-y-0.5 hover:border-emerald-200/90 hover:shadow-md"
          >
            <item.icon className="mb-3 h-5 w-5 text-emerald-700/80 transition group-hover:scale-105" />
            <span className="text-sm font-semibold text-slate-900">{item.label}</span>
            <span className="text-xs text-slate-500">{item.sub}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Fulfillment Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Active prescriptions</h2>
            <Badge variant="outline" className="shrink-0 border-emerald-100/90 text-[10px] font-medium text-slate-500">
              {orders.length} total
            </Badge>
          </div>

          {orders.map(order => {
            const currentIdx = getStepIndex(order.status);
            const railSteps = buildOrderFulfillmentRail(order);
            const railIdx = getOrderFulfillmentRailIndex(order);
            const tint = subBrandTint[order.subBrand] ?? subBrandTint.PeakHealth;
            const statusLabel = ORDER_STEPS[currentIdx]?.label ?? "Processing";

            return (
              <Card
                key={order.id}
                className="group overflow-hidden rounded-2xl border border-slate-100/90 bg-white/90 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/[0.03] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-38px_rgba(15,23,42,0.4)]"
              >
                <CardContent className="p-6 sm:p-8 md:p-10">
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
                          <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.3em]">Step 8–9 path</p>
                          <p className="text-2xl font-black text-amber-900 tracking-tight">Live visit — book & join from the portal</p>
                        </div>
                      </div>
                      <p className="text-base text-amber-800 font-medium leading-relaxed mb-8 italic opacity-90">
                        "{order.zoom_doctor_message || 'Your clinician would like a brief live visit after your step 8 intake. Book a time (Cal.com / Calendly); your Zoom or Meet link arrives after you confirm.'}"
                      </p>
                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-[1.5rem] h-16 font-black uppercase tracking-[0.2em] gap-3 shadow-xl shadow-amber-600/10"
                        onClick={() => navigate("/patient/appointments")}
                      >
                        Book visit (step 8 follow-up) <Calendar className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {/* Fulfillment rail — step 9 “progress tracking” from the journey map */}
                  <div className="relative pt-6 px-1">
                    <div className="absolute top-11 left-[5%] right-[5%] h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-[#0A2E1F] transition-all duration-1000 ease-out"
                        style={{
                          width: `${railSteps.length > 1 ? (railIdx / (railSteps.length - 1)) * 100 : 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-start justify-between gap-1 relative z-10 overflow-x-auto pb-1">
                      {railSteps.map((step, i) => {
                        const Icon = stepIcon[step.key] ?? FileText;
                        const done = i <= railIdx;
                        const active = i === railIdx;
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-3 min-w-[52px] flex-1 max-w-[92px]">
                            <div
                              className={cn(
                                "h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl shrink-0",
                                done ? "bg-[#0A2E1F] text-white scale-105" : "bg-white text-slate-200 border border-slate-50",
                                active && "ring-4 ring-emerald-500/15"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <p
                              className={cn(
                                "text-[7px] font-black uppercase tracking-[0.12em] text-center leading-tight transition-all duration-500 w-full line-clamp-2",
                                active ? "text-[#0A2E1F] opacity-100" : done ? "text-slate-400 opacity-85" : "text-slate-200 opacity-60"
                              )}
                            >
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
           <div className="space-y-3">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Support</p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/support-hub"
                  className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100/90 bg-white/80 p-5 text-center shadow-sm ring-1 ring-slate-900/[0.02] transition hover:border-emerald-200/80 hover:shadow-md"
                >
                  <MessageSquare className="h-5 w-5 text-emerald-600/80" />
                  <span className="text-xs font-semibold text-slate-700">Help center</span>
                </Link>
                <Link
                  to="/faq"
                  className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100/90 bg-white/80 p-5 text-center shadow-sm ring-1 ring-slate-900/[0.02] transition hover:border-emerald-200/80 hover:shadow-md"
                >
                  <FileText className="h-5 w-5 text-emerald-600/80" />
                  <span className="text-xs font-semibold text-slate-700">FAQ</span>
                </Link>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
