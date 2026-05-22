import type { LucideIcon } from "lucide-react";
import { LayoutGrid, LineChart } from "lucide-react";
import { cn, Button } from "../../../components/ui/shared.tsx";
import { useRpmData } from "./useRpmData";
import { RpmKpiStrip } from "../../../components/doctor/rpm/RpmKpiStrip";
import { RpmPatientPicker } from "../../../components/doctor/rpm/RpmPatientPicker";
import { RpmInlineCharts } from "../../../components/doctor/rpm/RpmInlineCharts";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";
import type { RpmLiveRow } from "../../../../lib/rpmCommandCenter";
type Props = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  showKpis?: boolean;
  showWall?: boolean;
  filterRows?: (rows: RpmLiveRow[]) => RpmLiveRow[];
  extra?: React.ReactNode;
};

export function RpmWorkspace({
  title,
  subtitle,
  icon: Icon,
  showKpis = false,
  showWall = false,
  filterRows,
  extra,
}: Props) {
  const {
    range,
    setRange,
    filteredRows: allRows,
    selectedPatientKey,
    selectPatient,
    openPatientDrawer,
    getPatientReadings,
    missingTable,
    setWallMode,
  } = useRpmData();

  const rows = filterRows ? filterRows(allRows) : allRows;
  const selected = rows.find((r) => r.patient.key === selectedPatientKey) ?? allRows.find((r) => r.patient.key === selectedPatientKey) ?? null;
  const selectedReadings = selected ? getPatientReadings(selected) : [];

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-300">
      {missingTable && (
        <div className={cn(rpmGlass, "mx-2 sm:mx-4 p-4 text-sm text-amber-800 rpm-dark:text-amber-200")}>
          <p className="font-bold">Telemetry not provisioned</p>
          <p className="rpm-muted mt-1 text-xs">Run vital_readings SQL in Supabase.</p>
        </div>
      )}

      <div className={cn(rpmGlass, "mx-2 sm:mx-4 p-4 sm:p-5 flex flex-wrap items-center gap-3")}>
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shrink-0">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <h1 className="text-lg font-black rpm-text">{title}</h1>
          <p className="text-xs rpm-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(["24h", "7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-bold border",
                range === r ? "bg-[#0A2E1F] text-white border-transparent" : "rpm-border rpm-muted",
              )}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
          {showWall && (
            <Button variant="outline" size="sm" className="rounded-lg h-8 text-[10px] font-bold ml-auto sm:ml-0" onClick={() => setWallMode(true)}>
              <LayoutGrid className="h-3 w-3 mr-1" />
              Wall
            </Button>
          )}
        </div>
      </div>

      {showKpis && <RpmKpiStrip />}

      <div className="grid gap-3 lg:grid-cols-12 px-2 sm:px-4">
        <div className="lg:col-span-4 xl:col-span-3">
          <RpmPatientPicker
            rows={rows}
            selectedKey={selected?.patient.key ?? null}
            onSelect={selectPatient}
            onOpenChart={openPatientDrawer}
          />
        </div>

        <div className="lg:col-span-8 xl:col-span-9 space-y-3">
          <div className={cn(rpmGlass, "p-4 sm:p-5 min-h-[320px]")}>
            {selected ? (
              <RpmInlineCharts row={selected} readings={selectedReadings} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <LineChart className="h-14 w-14 rpm-muted opacity-30 mb-4" />
                <p className="font-bold rpm-text text-base">Select a patient</p>
                <p className="text-sm rpm-muted mt-1 max-w-sm">
                  Choose a patient from the list to view blood pressure, heart rate, oxygen, and glucose charts here.
                </p>
              </div>
            )}
          </div>
          {extra}
        </div>
      </div>
    </div>
  );
}
