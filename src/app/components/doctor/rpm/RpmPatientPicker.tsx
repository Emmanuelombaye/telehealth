import { ChevronRight, User } from "lucide-react";
import { cn, Button } from "../../ui/shared.tsx";
import { rpmGlass, RPM_STATUS_TONE, patientInitials } from "../../../../lib/rpmEnterpriseUi";
import type { RpmLiveRow } from "../../../../lib/rpmCommandCenter";

type Props = {
  rows: RpmLiveRow[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onOpenChart?: (key: string) => void;
};

export function RpmPatientPicker({ rows, selectedKey, onSelect, onOpenChart }: Props) {
  return (
    <div className={cn(rpmGlass, "flex flex-col max-h-[min(70vh,640px)] lg:max-h-[calc(100dvh-14rem)]")}>
      <div className="px-3 py-3 border-b border-black/5 rpm-dark:border-white/10 shrink-0">
        <p className="text-[10px] font-black uppercase tracking-widest rpm-muted">Patients</p>
        <p className="text-xs rpm-muted mt-0.5">{rows.length} in view · tap to load charts</p>
      </div>
      <ul className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {rows.length === 0 ? (
          <li className="text-sm rpm-muted text-center py-10 px-2">No patients in this section.</li>
        ) : (
          rows.map((row) => {
            const active = row.patient.key === selectedKey;
            const tone = RPM_STATUS_TONE[row.statusTone];
            return (
              <li key={row.patient.key}>
                <button
                  type="button"
                  onClick={() => onSelect(row.patient.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all",
                    active
                      ? "bg-[#0A2E1F] text-white shadow-md"
                      : "hover:bg-black/[0.04] rpm-dark:hover:bg-white/[0.06]",
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                      active ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-900",
                    )}
                  >
                    {patientInitials(row.patient.patient_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-bold truncate", active ? "text-white" : "rpm-text")}>
                      {row.patient.patient_name}
                    </p>
                    <p className={cn("text-[10px] truncate", active ? "text-emerald-200" : "rpm-muted")}>
                      {row.heartRate} · {row.bloodPressure}
                    </p>
                  </div>
                  <span className={cn("h-2 w-2 rounded-full shrink-0", tone.dot)} />
                </button>
              </li>
            );
          })
        )}
      </ul>
      {selectedKey && onOpenChart && (
        <div className="p-2 border-t border-black/5 rpm-dark:border-white/10 shrink-0">
          <Button
            className="w-full rounded-xl bg-[#0A2E1F] hover:bg-emerald-900 text-white text-xs font-bold h-9"
            onClick={() => onOpenChart(selectedKey)}
          >
            <User className="h-3.5 w-3.5 mr-1.5" />
            Full patient chart
            <ChevronRight className="h-3.5 w-3.5 ml-auto" />
          </Button>
        </div>
      )}
    </div>
  );
}
