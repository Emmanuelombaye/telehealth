import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ChevronRight, Radio, ShieldCheck } from "lucide-react";
import { cn } from "./ui/utils";
import { DoctorCommandPalette } from "./DoctorCommandPalette";
import { useDoctorClinicalMetrics } from "../../lib/doctorClinicalMetrics";
import { doctorPortalBaseFromPath } from "../../lib/doctorPortalBase";

const SEGMENT_LABEL: Record<string, string> = {
  patients: "Patient roster",
  queue: "Clinical queue",
  availability: "Availability",
  schedule: "Schedule",
  messages: "Messages",
  consult: "Case workspace",
  labs: "Labs",
  scribe: "AI scribe",
  rpm: "Remote monitoring",
  erx: "e-Prescribing",
  imaging: "Imaging",
  referrals: "Referrals",
  billing: "Billing",
  education: "Education",
  notifications: "Notifications",
};

export function DoctorPortalShell() {
  const { pathname } = useLocation();
  const metrics = useDoctorClinicalMetrics();

  const crumbs = useMemo(() => {
    const base = doctorPortalBaseFromPath(pathname);
    const segs = pathname.split("/").filter(Boolean);
    const rootSeg = segs[0];
    if (rootSeg !== "doctor" && rootSeg !== "providers") {
      return [{ label: "Physician · Overview", to: base }];
    }
    if (segs.length === 1) {
      return [{ label: "Physician · Overview", to: base }];
    }
    const out: { label: string; to: string }[] = [{ label: "Physician", to: base }];
    const rest = segs.slice(1);
    let acc = base;
    for (const seg of rest) {
      acc += `/${seg}`;
      out.push({
        label: SEGMENT_LABEL[seg] ?? seg.replace(/-/g, " "),
        to: acc,
      });
    }
    return out;
  }, [pathname]);

  return (
    <div className="w-full space-y-4 pb-2">
      {/* Clinical telemetry strip */}
      <div
        className={cn(
          "rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-950 via-[#0c1f16] to-slate-900",
          "px-4 py-3 text-white shadow-lg shadow-emerald-950/10"
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-200 ring-1 ring-emerald-400/20">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              Live clinical feed
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/90">
              Inbox <strong className="text-white">{metrics.pendingDecision}</strong>
            </span>
            <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-amber-100">
              Video action <strong>{metrics.videoActionRequired}</strong>
            </span>
            <span className="rounded-full bg-violet-400/15 px-2.5 py-1 text-violet-100">
              Follow-up <strong>{metrics.followUp}</strong>
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/70">
              Refills <strong className="text-white">{metrics.refillQueue}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
              HIPAA session
            </span>
            <DoctorCommandPalette />
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12px] font-semibold text-slate-500">
        {crumbs.map((c, i) => (
          <span key={`${c.to}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
            {i === crumbs.length - 1 ? (
              <span className="text-[#0A2E1F]">{c.label}</span>
            ) : (
              <Link to={c.to} className="hover:text-emerald-700 transition-colors">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
