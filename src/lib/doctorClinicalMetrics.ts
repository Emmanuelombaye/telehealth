import { useMemo } from "react";
import { usePatientStore } from "./patient-store";

/** Live counts for physician command surfaces (queue, shell, palette). */
export function useDoctorClinicalMetrics() {
  const orders = usePatientStore((s) => s.orders);

  return useMemo(() => {
    const pendingDecision = orders.filter((o) =>
      ["order_submitted", "medical_review"].includes(o.status)
    ).length;
    const videoActionRequired = orders.filter((o) => o.zoom_status === "requested").length;
    const followUp = orders.filter((o) => o.status === "follow_up").length;
    const refillQueue = orders.filter((o) => o.status === "refill_eligible").length;
    const intakeReady = orders.filter((o) =>
      ["id_verified", "intake_completed"].includes(o.status)
    ).length;

    return {
      pendingDecision,
      videoActionRequired,
      followUp,
      refillQueue,
      intakeReady,
      /** Total items competing for physician attention today */
      attentionLoad: pendingDecision + videoActionRequired + followUp,
    };
  }, [orders]);
}
