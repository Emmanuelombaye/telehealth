import { Link } from "react-router";
import {
  AlertTriangle,
  ClipboardList,
  FileCheck,
  ShieldAlert,
  Sparkles,
  Video,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { Badge, cn } from "../ui/shared.tsx";
import {
  buildDoctorIntakeReview,
  overallRiskStyles,
  riskLevelStyles,
  type OrderIntakeSource,
} from "../../../lib/doctorIntakeReview";
import { doctorSurfaceCard } from "../../../lib/doctorPortalUi";

type Props = {
  order: OrderIntakeSource;
  doctorBase: string;
  compact?: boolean;
  showConsultLink?: boolean;
};

export function DoctorIntakeReviewPanel({
  order,
  doctorBase,
  compact = false,
  showConsultLink = true,
}: Props) {
  const review = buildDoctorIntakeReview(order);

  if (!review.answers.length && !review.intakeNotes) {
    return (
      <CardEmpty message="No structured intake answers on this encounter yet." />
    );
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Risk banner */}
      <div
        className={cn(
          "rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
          review.overallRisk === "critical"
            ? "border-red-300 bg-gradient-to-r from-red-50 to-white"
            : review.overallRisk === "elevated"
              ? "border-amber-300 bg-gradient-to-r from-amber-50 to-white"
              : "border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white",
        )}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "h-11 w-11 shrink-0 rounded-xl flex items-center justify-center",
              review.overallRisk === "critical"
                ? "bg-red-100"
                : review.overallRisk === "elevated"
                  ? "bg-amber-100"
                  : "bg-emerald-100",
            )}
          >
            {review.overallRisk === "standard" ? (
              <FileCheck className="h-5 w-5 text-emerald-700" />
            ) : (
              <ShieldAlert
                className={cn(
                  "h-5 w-5",
                  review.overallRisk === "critical" ? "text-red-600" : "text-amber-600",
                )}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Clinical risk assessment
            </p>
            <p className="text-base font-black text-[#0A2E1F] capitalize">
              {review.overallRisk === "standard" ? "Standard clearance" : `${review.overallRisk} attention`}
            </p>
            <p className="text-xs text-slate-600 mt-0.5 truncate">
              {review.questionnaireName} · {review.patientName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Badge className={cn("rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase", overallRiskStyles(review.overallRisk))}>
            {review.overallRisk}
          </Badge>
          {review.requiresVideo && (
            <Badge className="rounded-lg border border-violet-200 bg-violet-50 text-violet-800 text-[10px] font-bold uppercase">
              <Video className="h-3 w-3 mr-1 inline" />
              Video required
            </Badge>
          )}
          {review.flagManualReview && (
            <Badge className="rounded-lg border border-orange-200 bg-orange-50 text-orange-800 text-[10px] font-bold uppercase">
              Manual review
            </Badge>
          )}
        </div>
      </div>

      {/* Critical / high flags */}
      {review.riskFlags.length > 0 && (
        <div className={cn(doctorSurfaceCard, "p-4 space-y-2")}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Risk flags & conditional logic
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {review.riskFlags.slice(0, compact ? 4 : 12).map((flag) => {
              const st = riskLevelStyles(flag.level);
              return (
                <div key={flag.id} className={cn("rounded-xl border p-3", st.border)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn("text-[9px] font-black uppercase border", st.badge)}>
                      {flag.level}
                    </Badge>
                    <span className={cn("text-xs font-bold text-[#0A2E1F]", st.icon)}>{flag.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{flag.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!compact && (
        <>
          {/* Symptoms + consent row */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className={cn(doctorSurfaceCard, "p-4")}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Symptoms summary
              </p>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">{review.symptomsSummary}</p>
            </div>
            <div className={cn(doctorSurfaceCard, "p-4")}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5 text-emerald-600" />
                Consent & enrollment
              </p>
              <p className="text-sm font-semibold text-[#0A2E1F]">{review.consentStatus}</p>
              {review.intakeNotes && (
                <p className="text-xs text-slate-600 mt-2 font-mono leading-relaxed bg-slate-50 rounded-lg p-2 border border-slate-100">
                  {review.intakeNotes}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Q&A */}
      <div className={cn(doctorSurfaceCard, "overflow-hidden")}>
        <div className="px-4 py-3 border-b border-emerald-100/80 bg-gradient-to-r from-white to-emerald-50/40 flex items-center justify-between">
          <p className="text-sm font-black text-[#0A2E1F]">Questionnaire responses</p>
          <span className="text-[10px] font-bold text-slate-500">{review.answers.length} answers</span>
        </div>
        <div className={cn("divide-y divide-slate-100", compact ? "max-h-[280px] overflow-y-auto custom-scrollbar" : "")}>
          {review.answers.map((row) => (
            <div
              key={row.questionId}
              className={cn(
                "px-4 py-3",
                row.highlight && "bg-red-50/60 border-l-4 border-l-red-500",
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 mb-1">
                {row.label}
              </p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  row.highlight ? "text-red-900" : "text-[#0A2E1F]",
                )}
              >
                {row.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showConsultLink && review.orderId && (
        <Link
          to={`${doctorBase}/consult?orderId=${encodeURIComponent(review.orderId)}`}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0A2E1F] text-white px-5 py-2.5 text-sm font-bold hover:bg-emerald-900 transition-colors"
        >
          <Stethoscope className="h-4 w-4" />
          Open case workspace
          <ChevronRight className="h-4 w-4 opacity-80" />
        </Link>
      )}
    </div>
  );
}

function CardEmpty({ message }: { message: string }) {
  return (
    <div className={cn(doctorSurfaceCard, "py-12 text-center text-sm text-slate-500")}>{message}</div>
  );
}
