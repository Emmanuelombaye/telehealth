import { Outlet, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { cn } from "../../../components/ui/shared.tsx";
import { RpmProvider, useRpmData } from "./useRpmData";
import { RpmTopBar } from "../../../components/doctor/rpm/RpmTopBar";
import { RpmSectionTabs } from "../../../components/doctor/rpm/RpmSectionTabs";
import { RpmPatientDrawer } from "../../../components/doctor/rpm/RpmPatientDrawer";
import { RpmMonitorCard } from "../../../components/doctor/rpm/RpmMonitorCard";
import { rpmShellClass } from "../../../../lib/rpmEnterpriseUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { useEffect, useMemo, useState } from "react";
import { RPM_METRIC_OPTIONS } from "../../../../lib/rpmCommandCenter";
import { toast } from "sonner";

function RpmShell() {
  const doctorBase = useDoctorPortalBase();
  const [searchParams] = useSearchParams();
  const {
    loading,
    theme,
    wallMode,
    setWallMode,
    filteredRows,
    drawerKey,
    drawerPinned,
    closePatientDrawer,
    openPatientDrawer,
    selectPatient,
    escalatePatientKey,
    getPatientReadings,
    getTimeline,
    allAlerts,
    orders,
    ordersLookup,
    range,
  } = useRpmData();
  const [chartMetric, setChartMetric] = useState<(typeof RPM_METRIC_OPTIONS)[number]["id"]>("bp");

  const urlPatientKey = searchParams.get("patient");

  useEffect(() => {
    if (loading || !urlPatientKey) return;
    const key = decodeURIComponent(urlPatientKey);
    const match = filteredRows.find((r) => r.patient.key === key);
    if (match) selectPatient(key);
  }, [loading, urlPatientKey, filteredRows, selectPatient]);

  const drawerRow = drawerKey ? filteredRows.find((r) => r.patient.key === drawerKey) ?? null : null;
  const drawerOrder = drawerRow?.patient.order_id
    ? orders.find((o) => o.id === drawerRow.patient.order_id) ?? null
    : drawerRow?.patient.patient_id
      ? ordersLookup.get(`user:${drawerRow.patient.patient_id}`) ?? null
      : null;

  const drawerReadings = useMemo(
    () => (drawerRow ? getPatientReadings(drawerRow) : []),
    [drawerRow, getPatientReadings],
  );
  const drawerTimeline = useMemo(
    () => (drawerRow ? getTimeline(drawerRow) : []),
    [drawerRow, getTimeline],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className={cn(rpmShellClass(theme === "dark"), theme === "dark" ? "rpm-dark" : "rpm-light")}>
      <RpmTopBar />
      <RpmSectionTabs />
      <div className="flex-1 min-w-0 pb-6 md:pb-8">
        <Outlet />
      </div>

      {wallMode && (
        <div className="fixed inset-0 z-[180] bg-[#030712]/95 backdrop-blur-xl p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-white">ICU wall — live monitoring</h2>
            <button
              type="button"
              onClick={() => setWallMode(false)}
              className="rounded-xl bg-white/10 text-white px-4 py-2 text-sm font-bold hover:bg-white/20"
            >
              Exit fullscreen
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredRows.map((row) => (
              <RpmMonitorCard
                key={row.patient.key}
                row={row}
                compact
                onOpen={() => selectPatient(row.patient.key)}
                onEscalate={() => {
                  escalatePatientKey(row.patient.key);
                  toast.warning(`Escalated: ${row.patient.patient_name}`);
                }}
              />
            ))}
          </div>
        </div>
      )}

      <RpmPatientDrawer
        open={!!drawerKey}
        pinned={drawerPinned}
        onClose={closePatientDrawer}
        row={drawerRow}
        order={drawerOrder}
        patientReadings={drawerReadings}
        alerts={allAlerts}
        timeline={drawerTimeline}
        doctorBase={doctorBase}
        range={range}
        chartMetric={chartMetric}
        onChartMetric={setChartMetric}
        dark={theme === "dark"}
        onEscalate={() => {
          if (drawerRow) {
            escalatePatientKey(drawerRow.patient.key);
            toast.warning(`Emergency escalation: ${drawerRow.patient.patient_name}`);
          }
        }}
      />
    </div>
  );
}

export function RpmLayout() {
  return (
    <RpmProvider>
      <RpmShell />
    </RpmProvider>
  );
}

/** Legacy export for routes that pointed at DoctorRPMPage */
export function DoctorRPMPage() {
  return <RpmLayout />;
}
