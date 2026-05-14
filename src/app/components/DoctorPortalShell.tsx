import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ChevronRight } from "lucide-react";
import { DoctorCommandPalette } from "./DoctorCommandPalette";
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
    <div className="w-full space-y-4 pb-1">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-wrap items-center gap-1 text-[12px] font-semibold text-slate-500"
        >
          {crumbs.map((c, i) => (
            <span key={`${c.to}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
              {i === crumbs.length - 1 ? (
                <span className="text-[#0A2E1F]">{c.label}</span>
              ) : (
                <Link to={c.to} className="transition-colors hover:text-emerald-700">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-4">
          <DoctorCommandPalette />
        </div>
      </div>

      <Outlet />
    </div>
  );
}
