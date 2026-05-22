import { Link } from "react-router";
import { Radio, LayoutGrid } from "lucide-react";
import { cn, Button } from "../../../components/ui/shared.tsx";
import { useRpmData } from "./useRpmData";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { RpmKpiStrip } from "../../../components/doctor/rpm/RpmKpiStrip";
import { RpmMonitorCard } from "../../../components/doctor/rpm/RpmMonitorCard";
import { RpmAlertsStream } from "../../../components/doctor/rpm/RpmAlertsStream";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";
import { toast } from "sonner";
import type { RpmTimeRange } from "../../../../lib/doctorRpm";

export function RpmLiveMonitoring() {
  const doctorBase = useDoctorPortalBase();
  const {
    range,
    setRange,
    filteredRows,
    setDrawerKey,
    escalatePatientKey,
    missingTable,
    setWallMode,
  } = useRpmData();

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {missingTable && (
        <div className={cn(rpmGlass, "mx-4 p-4 text-sm text-amber-800 rpm-dark:text-amber-200 border-amber-300/50")}>
          <p className="font-bold">Telemetry table not provisioned</p>
          <p className="rpm-muted mt-1">Run vital_readings SQL in Supabase. Roster still shows enrolled patients.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-4">
        <span className="text-[10px] font-black uppercase tracking-widest rpm-muted">Window</span>
        {(["24h", "7d", "30d", "all"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
              range === r
                ? "bg-[#0A2E1F] text-white border-transparent shadow-lg"
                : "rpm-border bg-white/60 rpm-dark:bg-slate-800/60 rpm-muted hover:rpm-text",
            )}
          >
            {r === "all" ? "All" : r}
          </button>
        ))}
        <Button
          variant="outline"
          className="ml-auto rounded-xl text-xs font-bold h-9"
          onClick={() => setWallMode(true)}
        >
          <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
          Hospital wall
        </Button>
      </div>

      <RpmKpiStrip />

      <div className="grid gap-4 xl:grid-cols-12 px-4">
        <section className="xl:col-span-8 space-y-3">
          <div className={cn(rpmGlass, "p-4")}>
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-5 w-5 text-emerald-600" />
              <div>
                <h1 className="text-lg font-black rpm-text">Live monitoring command center</h1>
                <p className="text-xs rpm-muted">{filteredRows.length} patients · real-time vitals</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredRows.length === 0 ? (
                <p className="col-span-full text-center py-16 rpm-muted text-sm">No patients in this window.</p>
              ) : (
                filteredRows.slice(0, 18).map((row) => (
                  <RpmMonitorCard
                    key={row.patient.key}
                    row={row}
                    onOpen={() => setDrawerKey(row.patient.key)}
                    onEscalate={() => {
                      escalatePatientKey(row.patient.key);
                      toast.warning(`Escalated: ${row.patient.patient_name}`);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="xl:col-span-4">
          <div className="sticky top-[5.5rem]">
            <p className="text-[10px] font-black uppercase tracking-widest rpm-muted mb-2 px-1">Alerts stream</p>
            <RpmAlertsStream max={12} />
            <Link
              to={`${doctorBase}/rpm/alerts`}
              className="block text-center text-xs font-bold text-emerald-600 mt-3 hover:underline"
            >
              Open alerts center →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
