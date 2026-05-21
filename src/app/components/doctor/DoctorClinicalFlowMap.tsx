import { Link } from "react-router";
import { Video, ArrowRight } from "lucide-react";
import { Card, CardContent, Button, cn } from "../ui/shared.tsx";
import { getDoctorFlowSteps, DOCTOR_FLOW_VIDEO_MODEL } from "../../../lib/doctorFlowArchitecture";
import { doctorSurfaceCard } from "../../../lib/doctorPortalUi";

type Props = {
  base: "/doctor" | "/providers";
  variant?: "compact" | "expanded";
};

export function DoctorClinicalFlowMap({ base, variant = "compact" }: Props) {
  const steps = getDoctorFlowSteps(base);
  const isExpanded = variant === "expanded";

  return (
    <Card
      className={cn(
        doctorSurfaceCard,
        "overflow-hidden border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/30",
      )}
    >
      <div className="relative overflow-hidden border-b border-emerald-100/70">
        <div className="pointer-events-none absolute -right-8 -top-16 h-40 w-72 rounded-full bg-teal-200/35 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-[12%] h-24 w-40 rounded-full bg-emerald-300/25 blur-xl" />

        <div className="relative flex flex-col gap-4 bg-white/65 p-5 backdrop-blur-[2px] sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 to-[#0A2E1F] text-sm font-black text-white shadow-lg shadow-emerald-900/20">
                ①
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight text-[#0A2E1F] md:text-xl">Clinical operating model</h2>
                <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-slate-600 md:text-[13px]">
                  Mapped to routes in this portal — aligned with the patient journey and visit types (required
                  enrollment video vs clinician-requested live visit).
                </p>
              </div>
            </div>
          </div>
          {!isExpanded ? (
            <Link to={`${base}/workflow`} className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-emerald-200/80 bg-white/90 font-semibold text-[#0A2E1F] shadow-sm gap-2 transition-all hover:border-emerald-300 hover:bg-emerald-50/60 whitespace-nowrap"
              >
                Expand map <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="relative border-b border-violet-100/70 bg-gradient-to-r from-emerald-100/50 via-teal-100/35 to-violet-100/40 px-5 py-4 sm:px-6">
        <div className="pointer-events-none absolute inset-y-4 right-[18%] w-24 rounded-full bg-violet-200/45 blur-xl" aria-hidden />
        <div className="relative flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/50 bg-white/90 text-emerald-700 shadow-sm">
            <Video className="h-5 w-5" aria-hidden />
          </div>
          <p className="min-w-0 text-[11px] font-medium leading-relaxed text-emerald-950/90 sm:text-xs">
            <span className="font-bold text-[#0A2E1F]">Video alignment — </span>
            {DOCTOR_FLOW_VIDEO_MODEL}
          </p>
        </div>
      </div>

      <CardContent className={cn("relative p-4 sm:p-6", isExpanded ? "pb-10" : "pb-7")}>
        <div className={cn(isExpanded ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-5" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5")}>
          {steps.map((s) => (
            <Link
              key={s.id}
              to={s.href}
              className={cn(
                "group flex flex-col rounded-2xl border border-emerald-100/70 bg-white/92 p-4 shadow-[0_2px_14px_-6px_rgba(10,46,31,0.12)] backdrop-blur-sm transition-all duration-300",
                "hover:-translate-y-0.5 hover:border-teal-300/70 hover:shadow-[0_12px_36px_-12px_rgba(13,148,136,0.28)]",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-900 transition-colors group-hover:border-teal-200 group-hover:from-teal-50 group-hover:to-emerald-50">
                  <s.icon className="h-[18px] w-[18px]" aria-hidden />
                </div>
                <span className="max-w-[96px] truncate text-[9px] font-bold uppercase tracking-wider text-teal-600/85">
                  {s.phase}
                </span>
              </div>
              <p className="text-[13px] font-bold leading-snug text-[#0A2E1F]">{s.title}</p>
              <p className="mt-2 flex-1 text-[11px] font-medium leading-relaxed text-slate-600">{s.detail}</p>
              {(s.videoNote || s.patientMirror) && (
                <div className="mt-3 space-y-1 border-t border-emerald-100/70 pt-3">
                  {s.patientMirror && (
                    <p className="text-[10px] font-medium leading-relaxed text-slate-500">
                      <span className="font-bold text-teal-800/90">Patient — </span>
                      {s.patientMirror}
                    </p>
                  )}
                  {s.videoNote && (
                    <p className="text-[10px] font-medium leading-relaxed text-violet-800">
                      <span className="font-bold">Video — </span>
                      {s.videoNote}
                    </p>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
