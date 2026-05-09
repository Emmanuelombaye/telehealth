import { useState, useEffect } from "react";
import { Pill, MapPin, Clock, Loader2, ShoppingBag, ChevronRight, Stethoscope, ShieldCheck, ArrowRight, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

export function PrescriptionsPage() {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPrescriptions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    const ch = supabase.channel('px_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, fetchPrescriptions)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const getStatusConfig = (s: string) => {
    const config: Record<string, { label: string; color: string; bg: string; iconBg: string }> = {
      active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-100', iconBg: 'bg-emerald-500' },
      fulfilled: { label: 'Fulfilled', color: 'text-blue-700', bg: 'bg-blue-100', iconBg: 'bg-blue-500' },
      expired: { label: 'Expired', color: 'text-slate-600', bg: 'bg-slate-100', iconBg: 'bg-slate-400' },
      discontinued: { label: 'Discontinued', color: 'text-red-700', bg: 'bg-red-100', iconBg: 'bg-red-500' },
    };
    return config[s] || { label: s, color: 'text-slate-600', bg: 'bg-slate-100', iconBg: 'bg-slate-400' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Accessing Pharmacy Records...</p>
      </div>
    );
  }

  const activeCount = prescriptions.filter(p => p.status === 'active').length;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Header section */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight italic uppercase">My Prescriptions</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
            {prescriptions.length} Records found • {activeCount} Active Treatments
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/10 shadow-none rounded-[2rem]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Pill className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Active Rx</span>
            </div>
            <p className="text-3xl font-black italic">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100 shadow-none rounded-[2rem]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Next Refill</span>
            </div>
            <p className="text-sm font-bold text-emerald-900">READY IN 12 DAYS</p>
          </CardContent>
        </Card>
      </div>

      {/* List section */}
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/20 rounded-[2.5rem]">
            <CardContent className="p-16 text-center">
              <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold italic uppercase tracking-tight">No Active Prescriptions</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Once your physician approves a treatment request, it will appear here with fulfillment details.
              </p>
              <Link to="/patient/shop" className="inline-block mt-8">
                <Button className="rounded-2xl h-12 px-8 font-black uppercase italic text-xs tracking-widest gap-2 shadow-xl shadow-primary/20">
                  Browse Dispensary <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {prescriptions.map((rx, idx) => {
                const config = getStatusConfig(rx.status);
                return (
                  <motion.div
                    key={rx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="group border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all rounded-[2.5rem] overflow-hidden cursor-pointer">
                      <CardContent className="p-0">
                        <div className="p-6 flex items-start gap-5">
                          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/5 transition-transform group-hover:scale-105", config.bg)}>
                            <Pill className={cn("h-7 w-7", config.color)} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-black text-lg italic uppercase tracking-tight truncate">{rx.medication}</h3>
                              <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest border-none px-3 py-1", config.bg, config.color)}>
                                {config.label}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Stethoscope className="h-3.5 w-3.5" />
                                <span className="text-xs font-bold uppercase tracking-tight">DR. MARCUS THORNE</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-xs font-bold uppercase tracking-tight">{rx.pharmacy_name || "VIALSRX EXPRESS"}</span>
                              </div>
                            </div>

                            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-primary/20 transition-colors">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dosage & Instructions</p>
                              <p className="text-sm font-medium text-slate-700 italic">"{rx.dosage} · {rx.frequency || "Take as directed by your physician."}"</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               <div className="flex items-center gap-2">
                                 <Clock className="h-3.5 w-3.5" />
                                 <span>Prescribed {new Date(rx.created_at).toLocaleDateString()}</span>
                               </div>
                               <div className="flex items-center gap-2 text-primary">
                                 <span>{rx.refills_remaining || 0} Refills Left</span>
                                 <ChevronRight className="h-3 w-3" />
                               </div>
                            </div>
                          </div>
                        </div>
                        
                        {rx.status === 'active' && (
                          <div className="bg-primary text-white p-4 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest">Refill Authorization Active</span>
                            <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase text-white hover:bg-white/10 gap-2">
                              <Download className="h-3.5 w-3.5" /> Get Prescription PDF
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Help section */}
      <Card className="bg-slate-900 border-none rounded-[2.5rem] overflow-hidden text-white">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-4">
             <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
               <Activity className="h-5 w-5 text-primary" />
             </div>
             <div>
               <h4 className="text-sm font-black uppercase tracking-widest italic">Clinical Support</h4>
               <p className="text-xs text-white/50 font-medium">Need help with your medication?</p>
             </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 rounded-xl bg-white text-black hover:bg-white/90 text-[10px] font-black uppercase tracking-widest h-10">Message Provider</Button>
            <Button variant="outline" className="flex-1 rounded-xl border-white/20 text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest h-10">Call Pharmacy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
