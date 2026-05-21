import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ClipboardList,
  Search,
  Filter,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { DoctorIntakeReviewPanel } from "../../../components/doctor/DoctorIntakeReviewPanel";
import { usePatientStore } from "../../../../lib";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import {
  buildDoctorIntakeReview,
  orderToIntakeSource,
  overallRiskStyles,
} from "../../../../lib/doctorIntakeReview";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";

export function DoctorClinicalIntakePage() {
  const doctorBase = useDoctorPortalBase();
  const { orders, fetchOrders } = usePatientStore();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "critical" | "elevated" | "standard">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const intakeOrders = useMemo(() => {
    return orders.filter((o) => {
      const ans = o.intakeAnswers ?? {};
      return (
        o.intakeComplete ||
        (typeof ans === "object" && ans !== null && Object.keys(ans).filter((k) => !k.startsWith("_")).length > 0) ||
        o.intakeNotes
      );
    });
  }, [orders]);

  const enriched = useMemo(
    () =>
      intakeOrders.map((o) => ({
        order: o,
        review: buildDoctorIntakeReview(orderToIntakeSource(o)),
      })),
    [intakeOrders],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ order, review }) => {
      if (riskFilter !== "all" && review.overallRisk !== riskFilter) return false;
      if (!q) return true;
      return (
        order.patientName?.toLowerCase().includes(q) ||
        order.medication?.toLowerCase().includes(q) ||
        order.category?.toLowerCase().includes(q) ||
        review.symptomsSummary.toLowerCase().includes(q)
      );
    });
  }, [enriched, search, riskFilter]);

  const stats = useMemo(() => {
    const critical = enriched.filter((e) => e.review.overallRisk === "critical").length;
    const elevated = enriched.filter((e) => e.review.overallRisk === "elevated").length;
    return { total: enriched.length, critical, elevated };
  }, [enriched]);

  const selected = filtered.find((e) => e.order.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Pre-consult review"
        title="Clinical Intake & Questionnaires"
        description="Review patient answers, conditional routing results, and high-risk flags before video visits or prescribing."
      >
        <Button
          variant="outline"
          className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"
          onClick={() => fetchOrders()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Link
          to={`${doctorBase}/queue`}
          className="inline-flex items-center rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] px-4 py-2 text-sm font-semibold hover:bg-[#D4AF37]/30"
        >
          Clinical queue
        </Link>
      </DoctorPageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Intakes on file", value: stats.total, icon: ClipboardList, color: "text-emerald-700" },
          { label: "Critical flags", value: stats.critical, icon: AlertTriangle, color: "text-red-600" },
          { label: "Elevated review", value: stats.elevated, icon: FileCheck, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className={doctorSurfaceCard}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl bg-emerald-50", s.color)}>
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

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className={cn(doctorSurfaceCard, "lg:col-span-4")}>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, medication..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#0A0D14] focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "critical", "elevated", "standard"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRiskFilter(f)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase border transition-colors",
                    riskFilter === f
                      ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
                  )}
                >
                  <Filter className="h-3 w-3 inline mr-1 opacity-60" />
                  {f}
                </button>
              ))}
            </div>
            <div className="max-h-[520px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No intake records match.</p>
              ) : (
                filtered.map(({ order, review }) => {
                  const active = selected?.order.id === order.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      className={cn(
                        "w-full text-left rounded-xl border p-3 transition-all",
                        active
                          ? "border-[#0A2E1F] bg-[#0A2E1F] text-white shadow-md"
                          : "border-slate-100 bg-white hover:border-emerald-200",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm truncate">{order.patientName}</p>
                        <Badge
                          className={cn(
                            "shrink-0 text-[8px] font-black uppercase border",
                            active ? "bg-white/20 text-white border-white/30" : overallRiskStyles(review.overallRisk),
                          )}
                        >
                          {review.overallRisk}
                        </Badge>
                      </div>
                      <p className={cn("text-[10px] mt-1 truncate", active ? "text-emerald-100" : "text-slate-500")}>
                        {order.medication}
                      </p>
                      {review.riskFlags.length > 0 && (
                        <p className={cn("text-[10px] mt-1 font-semibold", active ? "text-amber-200" : "text-red-600")}>
                          {review.riskFlags.length} flag{review.riskFlags.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-8">
          {selected ? (
            <DoctorIntakeReviewPanel
              order={orderToIntakeSource(selected.order)}
              doctorBase={doctorBase}
            />
          ) : (
            <Card className={doctorSurfaceCard}>
              <CardContent className="py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading intake records…</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
