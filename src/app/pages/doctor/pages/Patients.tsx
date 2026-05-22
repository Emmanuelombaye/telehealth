import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
  Stethoscope,
  HeartPulse,
  Radio,
  FolderOpen,
  ClipboardList,
  Video,
  ChevronRight,
  AlertTriangle,
  Filter,
  User,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { supabase } from "../../../../lib/supabaseClient";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import {
  buildPatientRegistry,
  CARE_STATUS_STYLES,
  formatPatientDate,
  ORDER_STATUS_LABEL,
  RISK_STYLES,
  type DoctorPatientRecord,
  type PatientCareStatus,
  type RawOrderRow,
} from "../../../../lib/doctorPatientManagement";
import {
  patientDocumentsHref,
  patientRpmHref,
  patientVitalsHref,
} from "../../../../lib/doctorPatientDeepLinks";

type FilterTab = "all" | PatientCareStatus | "high_risk";

export function DoctorPatientsPage() {
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();
  const [registry, setRegistry] = useState<DoctorPatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const fetchPatients = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, user_id, order_number, patient_name, patient_age, patient_email, sub_brand, category, medication, status, urgent, intake_complete, enrollment_video_required, patient_vitals, intake_answers, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setFetchError(null);
      setRegistry(buildPatientRegistry((data || []) as RawOrderRow[]));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load patient registry";
      console.error("Patient registry fetch error:", err);
      setFetchError(message);
      setRegistry([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    const ch = supabase
      .channel("doctor-patient-registry")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchPatients)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchPatients]);

  const stats = useMemo(() => {
    const needsReview = registry.filter((p) => p.careStatus === "needs_review").length;
    const highRisk = registry.filter((p) => p.risk === "high").length;
    const active = registry.filter((p) => p.careStatus === "active").length;
    return { total: registry.length, needsReview, highRisk, active };
  }, [registry]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registry.filter((p) => {
      if (filter === "high_risk" && p.risk !== "high") return false;
      if (filter !== "all" && filter !== "high_risk" && p.careStatus !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.subBrand?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.medication.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    });
  }, [registry, search, filter]);

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Care coordination"
        title="Patient Management"
        description="Unified registry from clinical encounters — review charts, intake risk, vitals, RPM devices, and longitudinal treatment history."
      >
        <Button
          variant="outline"
          className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20"
          onClick={fetchPatients}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
        <Link
          to={`${doctorBase}/queue`}
          className="inline-flex items-center rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] px-4 py-2 text-sm font-semibold hover:bg-[#D4AF37]/30"
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Clinical queue
        </Link>
      </DoctorPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Patients on chart", value: stats.total, icon: Users, accent: "text-emerald-700" },
          { label: "Needs review", value: stats.needsReview, icon: AlertTriangle, accent: "text-amber-600" },
          { label: "Active care", value: stats.active, icon: Stethoscope, accent: "text-indigo-600" },
          { label: "High risk", value: stats.highRisk, icon: HeartPulse, accent: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className={doctorSurfaceCard}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("rounded-2xl bg-emerald-50 p-3", s.accent)}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, treatment, email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#0A0D14] focus:outline-none focus:border-emerald-600"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "All" },
              { id: "needs_review", label: "Needs review" },
              { id: "active", label: "Active" },
              { id: "high_risk", label: "High risk" },
              { id: "completed", label: "Completed" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-black uppercase border transition-colors inline-flex items-center gap-1",
                filter === tab.id
                  ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
              )}
            >
              <Filter className="h-3 w-3 opacity-50" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-bold uppercase tracking-widest">Loading patient registry…</p>
        </div>
      ) : fetchError ? (
        <Card className={cn(doctorSurfaceCard, "border-red-200/80 bg-red-50/30")}>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="font-bold text-[#0A2E1F]">Could not load patients</p>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">{fetchError}</p>
            <Button className="mt-4 rounded-xl" onClick={fetchPatients} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className={doctorSurfaceCard}>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
            <p className="font-bold text-[#0A2E1F]">
              {registry.length === 0 ? "No patients on file yet" : "No patients match your filters"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {registry.length === 0
                ? "Each checkout order in Supabase appears here as one chart (grouped by patient)."
                : "Try a different filter or clear your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const care = CARE_STATUS_STYLES[p.careStatus];
            const risk = RISK_STYLES[p.risk];
            const consultId = p.orders[0]?.order_number || p.orders[0]?.id || p.primaryOrderId;
            return (
              <Card
                key={p.registryKey}
                className={cn(
                  doctorSurfaceCard,
                  "overflow-hidden transition-shadow hover:shadow-lg",
                  p.risk === "high" && "ring-1 ring-red-200",
                )}
              >
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => navigate(`${doctorBase}/patients/${p.primaryOrderId}`)}
                    className="w-full text-left p-5 pb-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#0A2E1F] to-emerald-800 flex items-center justify-center text-lg font-black text-emerald-100">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-[#0A2E1F] truncate">{p.name}</h3>
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", risk.dot)} title={risk.label} />
                        </div>
                        <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                          {p.medication} · {p.category}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.subBrand && (
                            <Badge className="text-[9px] font-black uppercase border bg-violet-50 text-violet-900 border-violet-200">
                              {p.subBrand}
                            </Badge>
                          )}
                          <Badge className={cn("text-[9px] font-black uppercase border", care.badge)}>
                            {care.label}
                          </Badge>
                          <Badge className={cn("text-[9px] font-black uppercase border", risk.badge)}>
                            {risk.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div className="rounded-lg bg-slate-50 py-2 px-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Encounters</p>
                        <p className="text-sm font-black text-[#0A2E1F]">{p.encounterCount}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 py-2 px-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Last visit</p>
                        <p className="text-[10px] font-bold text-slate-700">{formatPatientDate(p.lastEncounterAt)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 py-2 px-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Status</p>
                        <p className="text-[10px] font-bold text-slate-700 truncate">
                          {ORDER_STATUS_LABEL[p.latestStatus] || p.latestStatus}
                        </p>
                      </div>
                    </div>
                  </button>

                  <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                    <button
                      type="button"
                      title="Open chart"
                      onClick={() => navigate(`${doctorBase}/patients/${p.primaryOrderId}`)}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-center gap-1"
                    >
                      <User className="h-3.5 w-3.5" />
                      Chart
                    </button>
                    <button
                      type="button"
                      title="Case workspace"
                      onClick={() => navigate(`${doctorBase}/consult?orderId=${encodeURIComponent(consultId)}`)}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-center gap-1"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      Consult
                    </button>
                    <button
                      type="button"
                      title="Clinical intake"
                      onClick={() => navigate(`${doctorBase}/intake`)}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-center gap-1"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-1 px-3 pb-3 pt-1">
                    {[
                      { icon: HeartPulse, to: patientVitalsHref(doctorBase, p), label: "Vitals" },
                      { icon: Radio, to: patientRpmHref(doctorBase, p), label: "RPM" },
                      { icon: FolderOpen, to: patientDocumentsHref(doctorBase, p), label: "Docs" },
                      ...(p.enrollmentVideoRequired
                        ? [{ icon: Video, to: `${doctorBase}/consult?orderId=${encodeURIComponent(consultId)}`, label: "Video" }]
                        : []),
                    ].map((action) => (
                      <Link
                        key={action.label}
                        to={action.to}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-100 bg-white py-1.5 text-[9px] font-bold text-slate-600 hover:border-emerald-200 hover:text-emerald-800"
                      >
                        <action.icon className="h-3 w-3" />
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
