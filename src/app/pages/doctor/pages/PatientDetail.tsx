import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Activity,
  Pill,
  FileText,
  AlertCircle,
  ShieldCheck,
  Video,
  Stethoscope,
  HeartPulse,
  Radio,
  FolderOpen,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { DoctorIntakeReviewPanel } from "../../../components/doctor/DoctorIntakeReviewPanel";
import { supabaseOrderToIntakeSource } from "../../../../lib/doctorIntakeReview";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import {
  buildPatientRegistry,
  CARE_STATUS_STYLES,
  formatPatientDate,
  ORDER_STATUS_LABEL,
  RISK_STYLES,
  type RawOrderRow,
} from "../../../../lib/doctorPatientManagement";

type ChartTab = "overview" | "encounters" | "intake";

export function DoctorPatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();
  const [patientData, setPatientData] = useState<RawOrderRow | null>(null);
  const [history, setHistory] = useState<RawOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ChartTab>("overview");
  const [vitalsFlagged, setVitalsFlagged] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);

  const fetchPatient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: baseOrder, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) throw error;

      let historyQuery = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (baseOrder.user_id) {
        historyQuery = historyQuery.eq("user_id", baseOrder.user_id);
      } else if (baseOrder.patient_name) {
        historyQuery = historyQuery.eq("patient_name", baseOrder.patient_name);
      } else {
        historyQuery = historyQuery.eq("id", baseOrder.id);
      }
      const { data: allOrders } = await historyQuery;

      setHistory((allOrders || []) as RawOrderRow[]);
      setPatientData(baseOrder as RawOrderRow);

      const userId = baseOrder.user_id;
      if (userId) {
        const [vitalsRes, docsRes] = await Promise.all([
          supabase
            .from("vital_readings")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", userId)
            .eq("flagged", true),
          supabase
            .from("patient_documents")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", userId),
        ]);
        if (!vitalsRes.error && !isMissingTableError(vitalsRes.error)) {
          setVitalsFlagged(vitalsRes.count ?? 0);
        }
        if (!docsRes.error && !isMissingTableError(docsRes.error)) {
          setDocumentCount(docsRes.count ?? 0);
        }
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const record = useMemo(() => {
    if (!patientData) return null;
    const reg = buildPatientRegistry(history.length ? history : [patientData]);
    return reg[0] ?? null;
  }, [patientData, history]);

  const requiresAction = history.some((o) =>
    ["medical_review", "order_submitted"].includes(o.status || ""),
  );

  const consultOrderId = patientData?.order_number || patientData?.id || id;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!patientData || !record) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Profile Not Found</h2>
        <Button variant="outline" onClick={() => navigate(`${doctorBase}/patients`)} className="mt-4">
          Back to registry
        </Button>
      </div>
    );
  }

  const care = CARE_STATUS_STYLES[record.careStatus];
  const risk = RISK_STYLES[record.risk];

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-20 animate-in fade-in duration-500")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate(`${doctorBase}/patients`)}
          className="text-slate-500 hover:bg-white font-bold uppercase text-[10px] tracking-widest gap-2 h-9 px-3 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" /> Patient registry
        </Button>
        <Badge className="h-8 rounded-lg border-emerald-200/70 bg-emerald-50 px-4 font-bold uppercase tracking-widest text-emerald-800 text-[9px] gap-2">
          <ShieldCheck className="h-3.5 w-3.5" /> HIPAA chart
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Encounters", value: record.encounterCount, icon: Pill },
          { label: "Flagged vitals", value: vitalsFlagged, icon: HeartPulse },
          { label: "Documents", value: documentCount, icon: FolderOpen },
          { label: "Care status", value: care.label, icon: Activity },
        ].map((s) => (
          <Card key={s.label} className={doctorSurfaceCard}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="h-5 w-5 text-emerald-700" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">{s.label}</p>
                <p className="text-lg font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { to: `${doctorBase}/consult?orderId=${encodeURIComponent(consultOrderId || "")}`, icon: Stethoscope, label: "Case workspace" },
          { to: `${doctorBase}/vitals`, icon: HeartPulse, label: "Vitals" },
          { to: `${doctorBase}/rpm`, icon: Radio, label: "RPM" },
          { to: `${doctorBase}/documents`, icon: FolderOpen, label: "Documents" },
          { to: `${doctorBase}/intake`, icon: ClipboardList, label: "Intake hub" },
          { to: `${doctorBase}/queue`, icon: ClipboardList, label: "Queue" },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0A2E1F] hover:border-emerald-300 hover:bg-emerald-50"
          >
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </Link>
        ))}
        {record.enrollmentVideoRequired && (
          <Link
            to={`${doctorBase}/consult?orderId=${encodeURIComponent(consultOrderId || "")}`}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900"
          >
            <Video className="h-3.5 w-3.5" />
            Video required
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "encounters", label: "Encounters" },
            { id: "intake", label: "Clinical intake" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black uppercase border transition-colors",
              tab === t.id
                ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className={cn(doctorSurfaceCard, "overflow-hidden")}>
              <div className="h-24 bg-gradient-to-r from-[#0A2E1F] to-emerald-800 relative">
                <div className="absolute -bottom-10 left-6">
                  <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-xl">
                    <div className="h-full w-full bg-emerald-50 rounded-xl flex items-center justify-center font-black text-3xl text-emerald-800">
                      {patientData.patient_name?.charAt(0) || "U"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-14 p-6 space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-[#0A2E1F]">{patientData.patient_name}</h1>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    Age {patientData.patient_age ?? "—"} · Last encounter {formatPatientDate(record.lastEncounterAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className={cn("text-[9px] font-black uppercase border", care.badge)}>{care.label}</Badge>
                    <Badge className={cn("text-[9px] font-black uppercase border", risk.badge)}>{risk.label}</Badge>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Address</p>
                      <p className="font-semibold text-slate-700">
                        {patientData.shipping_address_line1 || "—"}
                        {patientData.shipping_city && `, ${patientData.shipping_city}`}
                        {patientData.shipping_state && ` ${patientData.shipping_state}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Phone</p>
                      <p className="font-semibold text-slate-700">{patientData.patient_phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Email</p>
                      <p className="font-semibold text-slate-700 truncate">{patientData.patient_email || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {requiresAction && (
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <h3 className="text-sm font-black text-amber-900 uppercase">Action required</h3>
                  </div>
                  <p className="text-xs text-amber-800 mb-4">Active encounters need physician review or authorization.</p>
                  <Button
                    onClick={() => navigate(`${doctorBase}/consult?orderId=${encodeURIComponent(consultOrderId || "")}`)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Open case workspace
                  </Button>
                </CardContent>
              </Card>
            )}

            {record.intake && (
              <Card className={cn(doctorSurfaceCard, "border-dashed border-emerald-200")}>
                <CardContent className="p-5 grid grid-cols-2 gap-3 text-sm">
                  <p className="col-span-2 text-[10px] font-black uppercase text-emerald-800">Enrollment baseline</p>
                  {record.intake.weight && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Weight</p>
                      <p className="font-bold">{record.intake.weight}</p>
                    </div>
                  )}
                  {record.intake.bmi && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">BMI</p>
                      <p className="font-bold">{record.intake.bmi}</p>
                    </div>
                  )}
                  {record.intake.allergies && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-500 uppercase">Allergies</p>
                      <p className="font-semibold text-red-800">{record.intake.allergies}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className={doctorSurfaceCard}>
              <CardContent className="p-6">
                <h2 className="text-base font-black text-[#0A2E1F] mb-4">Care summary</h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Primary treatment</p>
                    <p className="font-bold text-[#0A2E1F] mt-1">{record.medication}</p>
                    <p className="text-xs text-slate-500">{record.category}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Latest status</p>
                    <p className="font-bold text-[#0A2E1F] mt-1">
                      {ORDER_STATUS_LABEL[record.latestStatus] || record.latestStatus}
                    </p>
                    <p className="text-xs text-slate-500">
                      Intake {record.intakeComplete ? "complete" : "in progress"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-6">
                  Use the Encounters tab for full order history, or Clinical intake for questionnaires and risk flags.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "encounters" && (
        <Card className={doctorSurfaceCard}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Pill className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-black text-[#0A2E1F]">Treatment history</h2>
              <Badge className="ml-auto text-[10px]">{history.length} encounters</Badge>
            </div>
            {history.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">{order.order_number} · {formatPatientDate(order.created_at)}</p>
                    <h3 className="font-black text-[#0A2E1F]">{order.medication || "Consultation"}</h3>
                    <p className="text-xs text-slate-500">{order.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="text-[9px] font-black uppercase">
                      {ORDER_STATUS_LABEL[order.status || ""] || order.status}
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`${doctorBase}/consult?orderId=${encodeURIComponent(order.order_number || order.id)}`)
                      }
                      className="rounded-xl text-xs font-bold"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "intake" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-black text-[#0A2E1F]">Clinical intake & questionnaires</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Latest encounter on chart</p>
            </div>
          </div>
          <DoctorIntakeReviewPanel order={supabaseOrderToIntakeSource(patientData)} doctorBase={doctorBase} />
        </div>
      )}
    </div>
  );
}
