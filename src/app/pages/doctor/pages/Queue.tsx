import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router";
import {
  Users, Clock, Video, MessageSquare, FileText, ChevronRight,
  CheckCircle2, AlertCircle, Circle, Stethoscope, Pill,
  Phone, ToggleLeft, ToggleRight, Search, Filter, Bell, Zap,
  Activity, HeartPulse, ShieldCheck, Database, Layers, ArrowUpRight,
  Sparkles, FlaskConical, Bot, Command, Globe, Truck, X, Loader2, RefreshCw, ArrowLeft
} from "lucide-react";
import { Card, CardContent, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { OrderStatus, Order, usePatientStore, useAuthStore } from "../../../../lib";
import { doctorMessagesHref, useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { getOrderVideoRail } from "../../../../lib/orderVideoRail";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { supabase } from "../../../../lib/supabaseClient";
import { approveAndDispatchPrescription } from "../../../../lib/prescriptions";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;
import { toast } from "sonner";
import { DoctorIntakeReviewPanel } from "../../../components/doctor/DoctorIntakeReviewPanel";
import { buildDoctorIntakeReview, orderToIntakeSource } from "../../../../lib/doctorIntakeReview";
import jsPDF from "jspdf";

const queueStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  order_submitted: { label: "Order Submitted", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  account_created: { label: "Account Created", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  id_verified: { label: "ID Verified", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  intake_completed: { label: "Intake Complete", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  medical_review: { label: "Physician Review", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  rx_sent: { label: "Rx Dispatched", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  shipped: { label: "In Transit", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  delivered: { label: "Delivered", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
  follow_up: { label: "Follow-up", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  refill_eligible: { label: "Refill Eligible", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

export function DoctorQueuePage() {
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();
  const { orders, updateOrderStatus, fetchOrders } = usePatientStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rxNote, setRxNote] = useState("");
  const [dosage, setDosage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState("truepill");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDispatching, setIsDispatching] = useState(false);

  const { user: authUser } = useAuthStore();
  const [docProfile, setDocProfile] = useState<any>(null);

  useEffect(() => {
    if (!selectedId || !authUser) {
      setDocProfile(null);
      return;
    }
    const fetchDocProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();
      if (!error && data) {
        setDocProfile(data);
      }
    };
    fetchDocProfile();
  }, [selectedId, authUser]);

  const generatePrescriptionPdfBase64 = (
    order: any,
    doctor: any,
    dosageInstructions: string,
    doctorNote: string
  ): string => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    // Document Styling Constants
    const margin = 15;
    let y_pos = 20;

    // Header / Branding
    doc.setFillColor(10, 46, 31); // Primary Green (#0A2E1F)
    doc.rect(margin, y_pos, 180, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("PEAK HEALTH PRESCRIPTION DIRECTIVE", margin + 5, y_pos + 7);
    y_pos += 18;

    // Prescriber Information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 46, 31);
    doc.text("PRESCRIBER INFO", margin, y_pos);
    doc.setDrawColor(10, 46, 31);
    doc.setLineWidth(0.3);
    doc.line(margin, y_pos + 2, 195, y_pos + 2);
    y_pos += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const docName = `Dr. ${doctor?.first_name || ""} ${doctor?.last_name || ""}`.trim() || "Attending Clinician";
    doc.text(`Name: ${docName} (${doctor?.specialty || "General Practice"})`, margin, y_pos);
    y_pos += 5;
    doc.text(`NPI: ${doctor?.provider_npi || "—"}    DEA: ${doctor?.provider_dea || "—"}`, margin, y_pos);
    y_pos += 5;
    const docAddress = `${doctor?.provider_address_line1 || ""} ${doctor?.provider_address_line2 || ""}, ${doctor?.provider_city || ""}, ${doctor?.provider_state || ""} ${doctor?.provider_zip || ""}`.trim();
    doc.text(`Clinic Address: ${docAddress || "900 Commonwealth Place, Virginia Beach, VA 23464"}`, margin, y_pos);
    y_pos += 10;

    // Patient Information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 46, 31);
    doc.text("PATIENT DEMOGRAPHICS", margin, y_pos);
    doc.line(margin, y_pos + 2, 195, y_pos + 2);
    y_pos += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Name: ${order?.patientName || "—"}`, margin, y_pos);
    y_pos += 5;
    doc.text(`DOB: ${order?.patient_dob || "—"}    Phone: ${order?.patient_phone || "—"}`, margin, y_pos);
    y_pos += 5;
    const shippingAddress = `${order?.shipping_address_line1 || ""} ${order?.shipping_address_line2 || ""}, ${order?.shipping_city || ""}, ${order?.shipping_state || ""} ${order?.shipping_zip || ""}`.trim();
    doc.text(`Shipping Address: ${shippingAddress || "—"}`, margin, y_pos);
    y_pos += 10;

    // Medication & SIG (Prescription details)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 46, 31);
    doc.text("PRESCRIPTION (Rx)", margin, y_pos);
    doc.line(margin, y_pos + 2, 195, y_pos + 2);
    y_pos += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(10, 46, 31);
    doc.text(`Rx: ${order?.medication || "—"}`, margin, y_pos);
    y_pos += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Directions (Sig): ${dosageInstructions || "As directed by physician"}`, margin, y_pos, { maxWidth: 175 });
    y_pos += 10;
    doc.text(`Dispense Quantity: ${order?.quantity || 1}    Refills Authorized: ${order?.refills_authorized ?? 0}`, margin, y_pos);
    y_pos += 5;
    doc.text(`NDC Code: ${order?.ndc_code || "—"}    DEA Schedule: ${order?.dea_schedule || "none"}`, margin, y_pos);
    y_pos += 12;

    // Attestation & Electronic Signature Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 46, 31);
    doc.text("CLINICAL ATTESTATION & SIGNATURE", margin, y_pos);
    doc.line(margin, y_pos + 2, 195, y_pos + 2);
    y_pos += 8;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "By signing below, I attest that I have completed a clinical evaluation of this patient and authorized this prescription electronically via the Peak Health portal. I certify that the information provided is accurate and complies with all applicable state and federal guidelines.",
      margin,
      y_pos,
      { maxWidth: 175 }
    );
    y_pos += 14;

    // Electronic Signature Stamp
    doc.setFillColor(240, 253, 244); // Light green background (#F0FDF4)
    doc.setDrawColor(167, 243, 208); // Emerald-200 border
    doc.rect(margin, y_pos, 180, 22, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70); // Emerald-800
    doc.text(`ELECTRONICALLY SIGNED BY: ${docName}`, margin + 5, y_pos + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(52, 211, 153); // Emerald-400
    doc.text(`Timestamp: ${new Date().toISOString()}`, margin + 5, y_pos + 12);
    doc.text(`Security Verification Reference: ${order?.id || "—"}-${Date.now()}`, margin + 5, y_pos + 17);

    // Return base64 string
    const pdfString = doc.output("datauristring");
    return pdfString.split(",")[1];
  };

  const queue = useMemo(() => {
    return orders.filter((o) => {
      const isActive = ["order_submitted", "medical_review", "id_verified", "intake_completed"].includes(
        o.status,
      );
      const needsRefill =
        o.status === "refill_eligible" || (o.nextRefillAt && new Date(o.nextRefillAt) <= new Date());

      if (!isActive && !needsRefill) return false;

      if (statusFilter !== "all" && o.status !== statusFilter) {
        if (statusFilter === "refill_eligible" && !needsRefill) return false;
        if (statusFilter !== "refill_eligible" && o.status !== statusFilter) return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = o.patientName?.toLowerCase().includes(q);
        const matchMed = o.medication?.toLowerCase().includes(q);
        const matchMRN = o.mrn?.toLowerCase().includes(q);
        if (!matchName && !matchMed && !matchMRN) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const selected = useMemo(
    () => (selectedId ? orders.find((o) => o.id === selectedId) ?? null : null),
    [orders, selectedId],
  );

  const summaryOrderIdRef = useRef<string | null>(null);
  const summaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!selectedId) {
      summaryOrderIdRef.current = null;
      setAiSummary("");
      setAiGenerating(false);
      return;
    }
    if (summaryOrderIdRef.current === selectedId) return;

    const buildSummary = () => {
      const order = usePatientStore.getState().orders.find((o) => o.id === selectedId);
      if (!order) return false;

      summaryOrderIdRef.current = selectedId;
      setDosage(order.dosageInstructions || "");
      setRxNote("");
      setAiGenerating(true);
      setAiSummary("");

      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);

      const review = buildDoctorIntakeReview(orderToIntakeSource(order));
      const flagLines = review.riskFlags.slice(0, 5).map((f) => `• ${f.title}: ${f.detail}`);
      const aiText = [
        `PATIENT SUMMARY — ${review.patientName}`,
        `Questionnaire: ${review.questionnaireName}`,
        `Overall risk: ${review.overallRisk.toUpperCase()}${review.requiresVideo ? " · Video required" : ""}`,
        "",
        `Symptoms: ${review.symptomsSummary}`,
        flagLines.length ? `Flags:\n${flagLines.join("\n")}` : "Flags: None flagged from intake rules.",
        "",
        `Consent: ${review.consentStatus}`,
      ].join("\n");

      summaryTimerRef.current = setTimeout(() => {
        setAiSummary(aiText);
        setAiGenerating(false);
      }, 400);
      return true;
    };

    if (!buildSummary()) {
      const retry = setTimeout(buildSummary, 400);
      return () => clearTimeout(retry);
    }

    return () => {
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-12")}>
      <DoctorPageHeader
        eyebrow="Clinical queue · real-time sync"
        title="Active patient queue"
        description="Prioritize by visit path (enrollment video vs async vs clinician request). Count updates silently in the table below."
      >
        <Badge
          variant="outline"
          className="rounded-xl border-emerald-200/90 bg-emerald-50/90 py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-emerald-800 shadow-sm gap-1.5 border"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden /> HIPAA secure
        </Badge>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-11 rounded-xl border-teal-200/80 bg-white font-semibold text-[#0A2E1F] shadow-sm hover:bg-teal-50/70 active:scale-[0.98]"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} aria-hidden />
          {isRefreshing ? "Syncing…" : "Refresh"}
        </Button>
      </DoctorPageHeader>

      <Card
        className={cn(doctorSurfaceCard, "flex min-h-[600px] flex-col overflow-hidden border-emerald-100/75")}
      >
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100/60 bg-gradient-to-r from-teal-50/40 via-white to-emerald-50/35 p-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, MRN, or medications..." 
              className="bg-white border-slate-200 rounded-xl pl-9 text-sm focus:border-emerald-500 outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               >
                 <option value="all">All Patients</option>
                 <option value="medical_review">Needs Medical Review</option>
                 <option value="order_submitted">Order Submitted</option>
                 <option value="intake_completed">Intake Complete</option>
                 <option value="refill_eligible">Refill Eligible</option>
               </select>
               <Button variant="outline" className={cn("rounded-xl border-slate-200 bg-white h-10 px-3 text-slate-500 hover:bg-slate-50 pointer-events-none gap-2", statusFilter !== 'all' && "text-emerald-700 bg-emerald-50 border-emerald-200")}>
                 <Filter className="h-4 w-4" />
                 {statusFilter !== 'all' && <span className="text-[10px] font-bold uppercase">{statusFilter.replace('_', ' ')}</span>}
               </Button>
             </div>
             <Button 
              onClick={handleRefresh}
              variant="outline"
              className="rounded-xl bg-white border-slate-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 gap-2 h-10 px-4"
             >
               <Activity className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
               Sync Ledger
             </Button>
          </div>
        </div>

        {/* Main Queue Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-6 py-4 font-semibold text-slate-500 w-1/4">Patient Details</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Treatment Requested</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Visit path</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Submission Time</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Current Status</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
                {queue.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={cn(
                      "group cursor-pointer transition-colors border-l-4 border-transparent",
                      selectedId === order.id
                        ? "bg-emerald-50/80 border-emerald-500"
                        : "hover:bg-emerald-50/40 hover:border-emerald-300",
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
                          selectedId === order.id 
                            ? "bg-emerald-600 text-white" 
                            : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100"
                        )}>
                          {order.patientName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-[#0A2E1F]">
                            {order.patientName}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5">MRN: {order.mrn || "PENDING"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{order.medication}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{order.category || "General Wellness"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const rail = getOrderVideoRail(order);
                        return (
                          <span
                            title={rail.sub}
                            className={cn(
                              "inline-flex max-w-[160px] rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                              rail.kind === "async" && "bg-slate-100 text-slate-600",
                              rail.kind === "enrollment_video" && "bg-violet-100 text-violet-800",
                              rail.kind === "doctor_requested_video" && "bg-amber-100 text-amber-900",
                              rail.kind === "video_confirmed" && "bg-emerald-100 text-emerald-900",
                            )}
                          >
                            {rail.badge}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-xs">
                          {new Date(order.orderedDate || (order as { ordered_date?: string }).ordered_date || order.created_at || Date.now()).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant="outline" className={cn(
                         "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1",
                         queueStatusConfig[order.status]?.bg,
                         queueStatusConfig[order.status]?.color,
                         queueStatusConfig[order.status]?.border
                       )}>
                         {queueStatusConfig[order.status]?.label}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button
                         variant="outline"
                         className={cn(
                           "h-8 rounded-lg text-[10px] font-black uppercase tracking-widest px-4",
                           selectedId === order.id
                             ? "bg-emerald-600 text-white border-emerald-600"
                             : "bg-white border-slate-200 text-slate-700",
                         )}
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedId(order.id);
                         }}
                       >
                         Review
                       </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {queue.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-slate-50/50 h-full">
              <CheckCircle2 className="h-16 w-16 text-emerald-200 mb-4" />
              <p className="text-lg font-bold text-slate-700">Queue is Clear</p>
              <p className="text-sm text-slate-500 mt-1">All patient requests have been reviewed.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Patient Detail — portaled so layout overflow/transform does not clip the drawer */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedId && (
              <div className="fixed inset-0 z-[200] flex justify-end bg-slate-900/40 backdrop-blur-sm">
                <div className="absolute inset-0" onClick={() => setSelectedId(null)} aria-hidden />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="relative z-10 flex h-dvh max-h-dvh w-full max-w-2xl min-h-0 flex-col border-l border-slate-200 bg-white shadow-2xl"
                >
              {/* Sidebar Header Navigation */}
              <div className="shrink-0 p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedId(null)} 
                  className="text-slate-500 hover:bg-white hover:text-[#0A2E1F] font-black uppercase text-[10px] tracking-widest gap-2 h-9 px-3 rounded-lg border border-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Queue
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedId(null)}
                  className="rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {!selected ? (
                <div className="flex flex-1 items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
              <>
              {/* Patient Identity Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xl text-emerald-800">
                    {selected.patientName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0A2E1F]">{selected.patientName}</h2>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-xs font-semibold text-slate-500">
                         AGE {selected.patientAge} • {selected.patientVitals?.sex || 'MALE'} • BMI {selected.patientVitals?.bmi || '24.5'}
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white flex flex-wrap gap-2">
                <Link
                  to={`${doctorBase}/consult?orderId=${encodeURIComponent(selected.order_number || selected.id)}`}
                  className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#0A2E1F] text-white hover:bg-[#153e2d] h-10 text-xs font-bold shadow-md transition-colors"
                >
                  <Stethoscope className="h-4 w-4" />
                  Open case workspace
                  <ChevronRight className="h-4 w-4 opacity-80" />
                </Link>
                {(selected.userId || selected.user_id) && (
                  <Link
                    to={doctorMessagesHref(doctorBase, selected.userId || selected.user_id)}
                    className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 h-10 text-xs font-bold transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Secure message
                  </Link>
                )}
              </div>

              {/* Sidebar Scrollable Content */}
              <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-50/30">
                
                {/* Clinical Request Info */}
                <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Clinical Request</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medication</p>
                        <p className="text-sm font-bold text-[#0A2E1F]">{selected.medication}</p>
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                        <p className="text-sm font-semibold text-slate-700">{selected.category}</p>
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reported Allergies</p>
                        <p className={cn("text-sm font-semibold", selected.intakeAnswers?.allergies ? "text-red-600" : "text-slate-700")}>
                          {selected.intakeAnswers?.allergies || 'None'}
                        </p>
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Meds</p>
                        <p className="text-sm font-semibold text-slate-700">{selected.intakeAnswers?.current_meds || 'None'}</p>
                     </div>
                   </div>
                </div>

                {/* AI Scribe Intake Summary */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Bot className="h-24 w-24 text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-widest">AI Clinical Summary</h4>
                  </div>
                  {aiGenerating ? (
                    <div className="flex items-center gap-3 text-indigo-600 relative z-10 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Analyzing intake questionnaire...</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10">{aiSummary}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-indigo-100/50 relative z-10">
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowIntakeModal(true)}
                          className="text-indigo-600 p-0 h-auto font-semibold text-sm hover:text-indigo-800"
                        >
                          View intake review <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                        <Link
                          to={`${doctorBase}/intake`}
                          className="text-indigo-600 font-semibold text-sm hover:text-indigo-800 inline-flex items-center"
                        >
                          Clinical intake hub <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                  </div>
                </div>

                {/* E-Prescribing Section */}
                <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <Pill className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-[#0A2E1F] uppercase tracking-widest">E-Prescribe Directive</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Dosage Instructions</label>
                      <Input 
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g. Inject 0.25mg once weekly"
                        className="font-medium text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5 flex items-center gap-2">
                        <Truck className="h-3 w-3" /> Pharmacy Destination
                      </label>
                      <select
                        value={selectedPharmacy}
                        onChange={(e) => setSelectedPharmacy(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 outline-none"
                      >
                        <option value="truepill">Truepill Partner Pharmacy (Default)</option>
                        <option value="thrivewell">ThriveWell Rx — External API</option>
                        <option value="pmci">PMCI Hub — Email Dispatch</option>
                        <option value="alto">Alto Pharmacy</option>
                        <option value="capsule">Capsule Pharmacy</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Provider Notes (Internal)</label>
                      <textarea 
                        value={rxNote}
                        onChange={(e) => setRxNote(e.target.value)}
                        placeholder="Clinical rationale or specific notes..."
                        className="w-full h-20 bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-800 focus:border-emerald-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar Action Footer */}
              <div className="shrink-0 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-white border-t border-slate-200 space-y-3">
                <Button
                  disabled={isDispatching}
                  onClick={async () => {
                    setIsDispatching(true);
                    try {
                      const rxDosage = dosage || selected.dosageInstructions || "As directed";
                      const rxNoteFinal = rxNote || "Patient approved via clinical review.";

                      let prescriptionPdfB64: string | undefined = undefined;
                      const isControlledThrivewell =
                        selectedPharmacy === "thrivewell" &&
                        selected.dea_schedule &&
                        ["ii", "iii", "iv", "v", "2", "3", "4", "5"].includes(selected.dea_schedule.toLowerCase());

                      if (isControlledThrivewell) {
                        prescriptionPdfB64 = generatePrescriptionPdfBase64(
                          selected,
                          docProfile,
                          rxDosage,
                          rxNoteFinal
                        );
                      }

                      const result = await approveAndDispatchPrescription({
                        orderKey: selected.dbId || selected.id,
                        patientId: selected.userId || selected.user_id,
                        medication: selected.medication,
                        dosageInstructions: rxDosage,
                        doctorNote: rxNoteFinal,
                        pharmacy: selectedPharmacy,
                        prescriptionPdfB64,
                      });

                      if (!result.ok) {
                        toast.error(`Pharmacy dispatch failed: ${result.error}`);
                        return;
                      }

                      await fetchOrders();
                      toast.success(
                        result.usedFallback
                          ? `Prescription recorded (local dispatch). Pharmacy: ${selectedPharmacy}.`
                          : `Prescription dispatched to ${selectedPharmacy}.`,
                      );
                      setSelectedId(null);
                    } catch (err: unknown) {
                      const m = err instanceof Error ? err.message : String(err);
                      toast.error(`Dispatch failed: ${m}`);
                    } finally {
                      setIsDispatching(false);
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all border-none"
                >
                  {isDispatching ? (
                    <><Activity className="h-4 w-4 animate-spin" /> Dispatching Rx...</>
                  ) : (
                    <><CheckCircle2 className="h-5 w-5" /> Approve & Dispatch Rx</>
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full border-slate-200 text-slate-700 h-11 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-all gap-2"
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      const originalContent = btn.innerHTML;
                      btn.innerHTML = '<span class="animate-pulse">Requesting...</span>';
                      btn.disabled = true;
                      
                      await supabase.from('orders').update({ 
                        zoom_status: 'requested', 
                        zoom_doctor_message: rxNote || "Please book a time for a video consult." 
                       }).eq('order_number', selected.id);
                      
                      await fetchOrders();
                      
                      setTimeout(() => {
                        btn.innerHTML = "Requested ✓";
                        setTimeout(() => {
                          btn.innerHTML = originalContent;
                          btn.disabled = false;
                          setSelectedId(null);
                        }, 1000);
                      }, 800);
                    }}
                  >
                    <Video className="h-4 w-4" /> Require Consult
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-red-100 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-200 h-11 rounded-xl font-semibold text-xs transition-all gap-2"
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      const orig = btn.innerHTML;
                      btn.innerText = "Rejecting...";
                      btn.disabled = true;
                      await supabase.from('orders').update({ status: 'cancelled', doctor_note: rxNote }).eq('order_number', selected.id);
                      await fetchOrders();
                      setSelectedId(null);
                    }}
                  >
                    <AlertCircle className="h-4 w-4" /> Reject/Refund
                  </Button>
                </div>
              </div>
              </>
              )}
            </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Full Intake Modal (Triggered from AI Summary) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showIntakeModal && selected && (
              <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-800">Comprehensive Intake Form</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowIntakeModal(false)} className="rounded-full hover:bg-slate-200">
                  <X className="h-5 w-5 text-slate-500" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
                <DoctorIntakeReviewPanel
                  order={orderToIntakeSource(selected)}
                  doctorBase={doctorBase}
                  showConsultLink={false}
                />
              </div>
            </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      
    </div>
  );
}
