import { Link } from "react-router";
import {
  CheckCircle2,
  UserPlus,
  AlertTriangle,
  Stethoscope,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button, cn } from "../../ui/shared.tsx";
import { useRpmData } from "../../../pages/doctor/rpm/useRpmData";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { ALERT_TIER_STYLES, timeAgo, type RpmAlert } from "../../../../lib/rpmCommandCenter";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";
import { doctorMessagesHref } from "../../../../lib/doctorPortalBase";

type Props = {
  filter?: "all" | "critical" | "warning" | "info";
  max?: number;
  fullPage?: boolean;
};

export function RpmAlertsStream({ filter = "all", max = 16, fullPage }: Props) {
  const doctorBase = useDoctorPortalBase();
  const { visibleAlerts, acknowledgeAlert, setDrawerKey, escalatePatientKey, ordersLookup } = useRpmData();

  const list = visibleAlerts
    .filter((a) => filter === "all" || a.tier === filter)
    .slice(0, fullPage ? 80 : max);

  const onAssign = (a: RpmAlert) => {
    toast.success(`Assigned to care team: ${a.patientName}`);
    acknowledgeAlert(a.id);
  };

  return (
    <div className={cn(!fullPage && rpmGlass, "p-4 space-y-2", fullPage && "space-y-3")}>
      {list.length === 0 ? (
        <p className="text-sm rpm-muted text-center py-12">No open alerts in this view.</p>
      ) : (
        list.map((a) => (
          <div
            key={a.id}
            className={cn(
              "rounded-2xl border p-3 transition-all hover:shadow-lg",
              ALERT_TIER_STYLES[a.tier],
              "rpm-dark:border-slate-700 rpm-dark:from-slate-800/80 rpm-dark:to-slate-900/60",
            )}
          >
            <div className="flex justify-between gap-2">
              <p className="font-bold text-sm">{a.patientName}</p>
              <span className="text-[10px] rpm-muted">{timeAgo(a.recordedAt)}</span>
            </div>
            <p className="font-semibold text-xs mt-0.5">{a.title}</p>
            <p className="text-xs rpm-muted mt-0.5">{a.detail}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold" onClick={() => acknowledgeAlert(a.id)}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ack
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold" onClick={() => onAssign(a)}>
                <UserPlus className="h-3 w-3 mr-1" />
                Nurse
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-bold text-red-700"
                onClick={() => {
                  escalatePatientKey(a.patientKey);
                  toast.warning(`Escalated: ${a.patientName}`);
                  setDrawerKey(a.patientKey);
                }}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Escalate
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold" onClick={() => setDrawerKey(a.patientKey)}>
                <Stethoscope className="h-3 w-3 mr-1" />
                Chart
              </Button>
              {(() => {
                const order = [...ordersLookup.values()].find(
                  (o) => o.patient_name === a.patientName || o.user_id === a.patientKey,
                );
                if (!order?.user_id) return null;
                return (
                  <Link
                    to={doctorMessagesHref(doctorBase, order.user_id)}
                    className="inline-flex h-7 items-center px-2 text-[10px] font-bold rounded-md hover:bg-black/5"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Message
                  </Link>
                );
              })()}
            </div>
          </div>
        ))
      )}
      {!fullPage && list.length >= max && (
        <Link to={`${doctorBase}/rpm/alerts`} className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-700 py-2">
          View all alerts <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
