import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button, cn } from "../../../components/ui/shared.tsx";
import { DoctorClinicalFlowMap } from "../../../components/doctor/DoctorClinicalFlowMap";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";

export function DoctorWorkflowPage() {
  const base = useDoctorPortalBase();

  return (
    <div className={cn(doctorPageContainer, "space-y-7 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Clinical operations blueprint"
        title="Workflow map"
        description="Onboarding → queue → chart → case disposition → pharmacy, notifications, and refills — aligned with the patient journey."
      >
        <Link to={base}>
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-white/35 bg-white/10 font-semibold text-white shadow-inner backdrop-blur-sm hover:bg-white/18 hover:text-white hover:border-emerald-200/70 gap-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Dashboard
          </Button>
        </Link>
      </DoctorPageHeader>

      <DoctorClinicalFlowMap base={base} variant="expanded" />
    </div>
  );
}