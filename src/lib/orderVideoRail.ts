import type { Order } from "./patient-store";

export type OrderVideoRailKind =
  | "async"
  | "enrollment_video"
  | "doctor_requested_video"
  | "video_confirmed";

export type OrderVideoRail = {
  kind: OrderVideoRailKind;
  /** Short badge for tables */
  badge: string;
  /** Tooltip / second line */
  sub: string;
};

/** Narrow shape so Consult can pass raw Supabase rows or normalized `Order` from the store. */
export type OrderVideoRailSource = Pick<
  Order,
  "intakeAnswers" | "zoomStatus" | "zoom_status" | "enrollmentVideoRequired"
> & {
  intake_answers?: Record<string, unknown> | null;
};

function intakeAnswersFrom(source: OrderVideoRailSource): Record<string, unknown> | undefined {
  const a = source.intakeAnswers ?? source.intake_answers;
  if (a && typeof a === "object" && !Array.isArray(a)) return a as Record<string, unknown>;
  return undefined;
}

function hasEnrollmentSchedulingSnapshot(source: OrderVideoRailSource): boolean {
  const a = intakeAnswersFrom(source);
  return Boolean(a && "_scheduling" in a);
}

function enrollmentVideoRequired(source: OrderVideoRailSource): boolean {
  if (source.enrollmentVideoRequired === true) return true;
  return hasEnrollmentSchedulingSnapshot(source);
}

/**
 * Labels the video “rail” for doctor queue/dashboard.
 * Prefer `enrollment_video_required` column when present; fall back to legacy `_scheduling` in intake_answers.
 */
export function getOrderVideoRail(order: OrderVideoRailSource): OrderVideoRail {
  const zs = (order.zoomStatus ?? order.zoom_status ?? "not_requested") as string;

  if (zs === "confirmed") {
    return {
      kind: "video_confirmed",
      badge: "Video confirmed",
      sub: "Patient has a booked or confirmed synchronous visit.",
    };
  }

  const enroll = enrollmentVideoRequired(order);

  if (enroll && (zs === "requested" || zs === "rescheduled")) {
    return {
      kind: "enrollment_video",
      badge: "Enrollment video",
      sub: "Path A — required at patient step 8 (protocol/state/rules).",
    };
  }

  if (!enroll && (zs === "requested" || zs === "rescheduled")) {
    return {
      kind: "doctor_requested_video",
      badge: "Clinician video (5B)",
      sub: "You (or workflow) requested video after async intake.",
    };
  }

  if (enroll && zs === "not_requested") {
    return {
      kind: "enrollment_video",
      badge: "Enrollment video · pending",
      sub: "Protocol requires video; patient may still be booking.",
    };
  }

  return {
    kind: "async",
    badge: "Async review",
    sub: "No enrollment video requirement on this order.",
  };
}
