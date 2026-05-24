import { getStepIndex, ORDER_STEPS, type Order, type OrderStatus } from "./patient-store";

const SHIPPED_IDX = getStepIndex("shipped");

/** Dashboard / tracking rail aligned with client journey map (through shipped). */
export type FulfillmentRailStep =
  | (typeof ORDER_STEPS)[number]
  | { key: "consultation"; label: string; desc: string };

const RAIL_HEAD: OrderStatus[] = [
  "order_submitted",
  "account_created",
  "id_verified",
  "intake_completed",
  "medical_review",
];

function zoomOf(order: Pick<Order, "zoom_status" | "zoomStatus">): string {
  return (order.zoomStatus ?? order.zoom_status ?? "not_requested") as string;
}

/** Video visit is part of this order’s lifecycle (intake-required or doctor-requested path). */
export function orderHasConsultationRail(order: Pick<Order, "zoom_status" | "zoomStatus">): boolean {
  const z = zoomOf(order);
  return z === "requested" || z === "confirmed" || z === "rescheduled";
}

export function buildOrderFulfillmentRail(
  order: Pick<Order, "zoom_status" | "zoomStatus">
): FulfillmentRailStep[] {
  const head = ORDER_STEPS.filter((s) => RAIL_HEAD.includes(s.key));
  const post = ORDER_STEPS.filter((s) => s.key === "rx_sent" || s.key === "shipped");
  if (!orderHasConsultationRail(order)) return [...head, ...post];
  return [
    ...head,
    {
      key: "consultation",
      label: "Live visit (Zoom / Meet)",
      desc: "Part of step 8 when required — book in Cal.com or Calendly; join link follows by email or text",
    },
    ...post,
  ];
}

/**
 * Active dot index on the fulfillment rail (0 .. steps.length-1).
 */
export function getOrderFulfillmentRailIndex(
  order: Pick<Order, "status" | "zoom_status" | "zoomStatus">
): number {
  const steps = buildOrderFulfillmentRail(order);
  const last = steps.length - 1;
  const clamp = (n: number) => Math.max(0, Math.min(last, n));
  const st = order.status;
  const baseIdx = getStepIndex(st);
  const z = zoomOf(order);
  const hasConsult = orderHasConsultationRail(order);

  if (baseIdx < 0) return 0;

  if (!hasConsult) {
    if (baseIdx <= 4) return clamp(baseIdx);
    if (st === "rx_sent") return clamp(5);
    if (st === "shipped" || st === "delivered") return clamp(6);
    if (st === "follow_up") return clamp(4);
    return clamp(6);
  }

  if (baseIdx <= 3) return clamp(baseIdx);
  if (baseIdx === 4) {
    if (z === "requested" || z === "confirmed" || z === "rescheduled") return clamp(5);
    return clamp(4);
  }
  if (st === "rx_sent") return clamp(6);
  if (st === "shipped" || st === "delivered") return clamp(7);
  if (st === "follow_up") return clamp(5);
  return clamp(7);
}

/**
 * Vertical order tracker: fulfillment rail (through shipped) plus delivered / follow-up / refill when applicable.
 */
export function buildOrderTrackingVerticalSteps(
  order: Pick<Order, "status" | "zoom_status" | "zoomStatus">
): FulfillmentRailStep[] {
  const rail = buildOrderFulfillmentRail(order);
  const sti = getStepIndex(order.status as OrderStatus);
  if (sti < 0 || sti <= SHIPPED_IDX) return rail;
  const post = ORDER_STEPS.filter((s) => {
    const i = getStepIndex(s.key);
    return i > SHIPPED_IDX && i <= sti;
  });
  return [...rail, ...post];
}

/** Active row index for the vertical tracking stepper. */
export function getOrderTrackingVerticalIndex(
  order: Pick<Order, "status" | "zoom_status" | "zoomStatus">
): number {
  const steps = buildOrderTrackingVerticalSteps(order);
  const sti = getStepIndex(order.status as OrderStatus);
  if (sti < 0) return 0;
  if (sti <= SHIPPED_IDX) return getOrderFulfillmentRailIndex(order);
  return steps.length - 1;
}

type OrderForStepCopy = Pick<
  Order,
  | "status"
  | "zoom_status"
  | "zoomStatus"
  | "doctor_note"
  | "doctorNote"
  | "pharmacy_note"
  | "pharmacyNote"
  | "zoom_doctor_message"
  | "consultation_time"
  | "consultationTime"
  | "zoom_rescheduled_time"
  | "tracking_number"
  | "tracking"
  | "carrier"
  | "estimatedDelivery"
  | "intake_complete"
> & {
  timeline?: { status: string; date?: string; note?: string }[];
};

/** Per-order step copy for the vertical tracker (replaces static ORDER_STEPS.desc where possible). */
export function getOrderStepDescription(order: OrderForStepCopy, step: FulfillmentRailStep): string {
  const doctorNote = order.doctor_note || order.doctorNote;
  const pharmacyNote = order.pharmacy_note || order.pharmacyNote;
  const timelineNote = (order.timeline || []).find((t) => t.status === step.key)?.note;

  if (step.key === "consultation") {
    const z = zoomOf(order);
    if (order.zoom_doctor_message) return order.zoom_doctor_message;
    if (z === "confirmed")
      return `Video visit confirmed${order.consultation_time || order.consultationTime ? ` · ${order.consultation_time || order.consultationTime}` : ""}.`;
    if (z === "rescheduled")
      return `Your visit was rescheduled${order.zoom_rescheduled_time ? ` to ${order.zoom_rescheduled_time}` : ""}. Open Appointments to confirm.`;
    if (z === "requested") return "Your physician requested a live video visit. Book a time in Appointments.";
    return step.desc;
  }

  if (step.key === "medical_review" && doctorNote) return doctorNote;
  if (step.key === "follow_up" && doctorNote) return doctorNote;
  if (step.key === "rx_sent" && pharmacyNote) return `Pharmacy: ${pharmacyNote}`;
  if (step.key === "shipped") {
    const tracking = order.tracking_number || order.tracking;
    if (tracking) {
      const carrier = order.carrier ? `${order.carrier} · ` : "";
      const eta = order.estimatedDelivery ? ` · ETA ${order.estimatedDelivery}` : "";
      return `${carrier}Tracking ${tracking}${eta}`;
    }
    if (pharmacyNote) return pharmacyNote;
  }
  if (step.key === "intake_completed" && order.intake_complete === false) {
    return "Complete your intake questionnaire in the patient portal.";
  }
  if (timelineNote) return timelineNote;

  return step.desc;
}
