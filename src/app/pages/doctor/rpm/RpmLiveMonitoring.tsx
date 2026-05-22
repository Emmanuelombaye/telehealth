import { Radio } from "lucide-react";
import { cn } from "../../../components/ui/shared.tsx";
import { RpmWorkspace } from "./RpmWorkspace";
import { RpmAlertsStream } from "../../../components/doctor/rpm/RpmAlertsStream";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";

export function RpmLiveMonitoring() {
  return (
    <RpmWorkspace
      title="Live monitoring"
      subtitle="Real-time vitals — select a patient to view charts"
      icon={Radio}
      showKpis
      showWall
      extra={
        <div className={cn(rpmGlass, "p-4")}>
          <p className="text-[10px] font-black uppercase tracking-widest rpm-muted mb-2">Live alerts</p>
          <RpmAlertsStream max={8} />
        </div>
      }
    />
  );
}
