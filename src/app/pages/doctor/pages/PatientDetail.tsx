import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  ArrowLeft, User, MapPin, Phone, Mail, Calendar, 
  Activity, Pill, FileText, CheckCircle2, Clock, 
  AlertCircle, ShieldCheck, Video, Stethoscope
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;

export function DoctorPatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatient() {
      if (!id) return;
      try {
        // Fetch the base order to get the patient details
        const { data: baseOrder, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Fetch all orders for this patient
        const { data: allOrders, error: histError } = await supabase
          .from('orders')
          .select('*')
          .or(`patient_name.eq."${baseOrder.patient_name}",user_id.eq."${baseOrder.user_id}"`)
          .order('created_at', { ascending: false });

        if (!histError && allOrders) {
          setHistory(allOrders);
        }

        setPatientData(baseOrder);
      } catch (err) {
        console.error("Error fetching patient profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center text-slate-300">
          <Activity className="h-10 w-10 animate-pulse mx-auto mb-4 text-emerald-400" />
          <p className="font-black uppercase text-[10px] tracking-widest">Compiling Clinical Profile...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Profile Not Found</h2>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // Derive highest urgency from history
  const requiresAction = history.some(o => ['medical_review', 'order_submitted'].includes(o.status));

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-20 animate-in fade-in duration-500")}>
      {/* HEADER NAV */}
      <div className="flex items-center justify-between mb-2">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="text-slate-500 hover:bg-white hover:text-emerald-700 font-bold uppercase text-[10px] tracking-widest gap-2 h-9 px-3 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Registry
        </Button>
        <Badge className="h-8 rounded-lg border-emerald-200/70 bg-emerald-50 px-4 font-bold uppercase tracking-widest text-emerald-800 text-[9px] gap-2 shadow-sm border">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure HIPAA Chart
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - DEMOGRAPHICS */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={cn(doctorSurfaceCard, "overflow-hidden border-emerald-100/60 shadow-lg shadow-emerald-900/5")}>
            <div className="h-24 bg-gradient-to-r from-[#0A2E1F] to-emerald-800 relative">
               <div className="absolute -bottom-10 left-6">
                 <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-xl">
                   <div className="h-full w-full bg-emerald-50 rounded-xl flex items-center justify-center font-black text-3xl text-emerald-800">
                     {patientData.patient_name?.charAt(0) || "U"}
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="pt-14 p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-black text-[#0A2E1F] uppercase tracking-tighter">{patientData.patient_name}</h1>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  DOB: {patientData.patient_dob || "Not Provided"} • AGE {patientData.patient_age || "N/A"}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Shipping Address</p>
                    <p className="text-sm font-bold text-slate-700 leading-snug">
                      {patientData.shipping_address_line1 || "No Address Provided"}<br/>
                      {patientData.shipping_address_line2 && <>{patientData.shipping_address_line2}<br/></>}
                      {patientData.shipping_city}{patientData.shipping_city ? ',' : ''} {patientData.shipping_state} {patientData.shipping_zip}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone Contact</p>
                    <p className="text-sm font-bold text-slate-700">{patientData.patient_phone || "Not Provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Contact</p>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{patientData.patient_email || "Not Provided"}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* REQUIRED ACTIONS QUICK-WIDGET */}
          {requiresAction && (
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm rounded-[1.5rem]">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Required Action</h3>
                </div>
                <p className="text-xs text-amber-700 font-medium mb-4">
                  There are active encounters requiring clinical review or prescription authorization.
                </p>
                <Button 
                  onClick={() => navigate(`/doctor/consult?orderId=${patientData.order_number}`)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] tracking-widest uppercase h-11 rounded-xl shadow-md"
                >
                  <Stethoscope className="h-4 w-4 mr-2" /> Open Clinical Workspace
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN - TREATMENTS & HISTORY */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className={cn(doctorSurfaceCard, "border-emerald-100/60")}>
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <Pill className="h-5 w-5" />
                   </div>
                   <div>
                     <h2 className="text-lg font-black text-[#0A2E1F] uppercase tracking-tight">Active & Past Treatments</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{history.length} Encounters Found</p>
                   </div>
                </div>
             </div>
             
             <div className="p-6 space-y-4">
                {history.map((order, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={order.id} 
                    className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group"
                  >
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-white border-slate-200 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-md px-2 py-0.5">
                              {order.order_number}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-base font-black text-[#0A2E1F]">{order.medication || "Consultation"}</h3>
                          <p className="text-[11px] font-bold text-slate-500 mt-1">{order.category}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                             <Badge className={cn(
                               "text-[9px] font-black uppercase tracking-widest rounded-md px-2.5 py-1",
                               order.status === 'rx_sent' || order.status === 'delivered' ? "bg-emerald-100 text-emerald-800" :
                               ['medical_review', 'order_submitted'].includes(order.status) ? "bg-amber-100 text-amber-800" :
                               "bg-slate-200 text-slate-700"
                             )}>
                               {order.status.replace(/_/g, ' ')}
                             </Badge>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/doctor/consult?orderId=${order.order_number}`)}
                            className="h-10 rounded-xl border-slate-200 text-[#0A2E1F] font-bold text-[10px] uppercase tracking-widest group-hover:bg-[#0A2E1F] group-hover:text-white group-hover:border-[#0A2E1F] transition-all"
                          >
                             Review
                          </Button>
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          </Card>

          <Card className={cn(doctorSurfaceCard, "border-emerald-100/60")}>
             <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                     <FileText className="h-5 w-5" />
                   </div>
                   <div>
                     <h2 className="text-lg font-black text-[#0A2E1F] uppercase tracking-tight">Clinical Intake Data</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From latest encounter</p>
                   </div>
                </div>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(patientData.intake_answers || {}).length > 0 ? (
                  Object.entries(patientData.intake_answers).map(([key, val]: [string, any], idx) => (
                    <div key={idx}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-bold text-slate-800">{Array.isArray(val) ? val.join(", ") : String(val)}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-400 font-medium">
                     No structured intake data available for this record.
                  </div>
                )}
             </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
