/**
 * Maps the cross-portal clinical operating model to concrete routes.
 * Enrollment video = patient step 8 (Path A); doctor-requested video = decision 5B (async → video).
 */

import type { LucideIcon } from "lucide-react";
import {
  UserPlus,
  ShieldCheck,
  ClipboardList,
  FileHeart,
  Stethoscope,
  GitBranch,
  Bell,
  Activity,
  Database,
  RefreshCw,
} from "lucide-react";

export type DoctorFlowStep = {
  id: string;
  phase: string;
  title: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  /** Cross-link to patient journey language */
  patientMirror?: string;
  videoNote?: string;
};

export const DOCTOR_FLOW_VIDEO_MODEL =
  "Enrollment Path A schedules video at patient step 8 (drug/state/admin/BMI-age — not questionnaire). " +
  "Decision 5B requests video when you need more context on an otherwise async case; both can use the same zoom_status pipeline.";

export function getDoctorFlowSteps(base: "/doctor" | "/providers"): DoctorFlowStep[] {
  const b = base;
  return [
    {
      id: "invite",
      phase: "Onboarding",
      title: "Provider invited",
      detail: "SuperAdmin issues credentials and profile (Calendly, licensed states).",
      href: "/superadmin/doctors",
      icon: UserPlus,
      patientMirror: "Patient discovers program / shop",
    },
    {
      id: "access",
      phase: "Onboarding",
      title: "Portal access & calendar",
      detail: "Secure login, MFA where enabled, link external scheduling for video slots.",
      href: `${b}/availability`,
      icon: ShieldCheck,
      videoNote: "Your Calendly/Cal.com URL powers enrollment booking and optional re-schedules.",
    },
    {
      id: "queue",
      phase: "Clinical",
      title: "Daily patient queue",
      detail: "Prioritized list: async review vs enrollment video vs refill windows.",
      href: `${b}/queue`,
      icon: ClipboardList,
      patientMirror: "Steps 1–7 complete; order in medical_review",
      videoNote: "Queue badges separate enrollment video from clinician-requested (5B) video.",
    },
    {
      id: "chart",
      phase: "Clinical",
      title: "Chart & intake",
      detail: "Vitals, allergies, protocol — video rules never come from questionnaire answers alone.",
      href: `${b}/patients`,
      icon: FileHeart,
      patientMirror: "Intake & ID on file",
    },
    {
      id: "decision",
      phase: "Clinical",
      title: "Decision 5A / 5B / 5C",
      detail: "Prescribe, request video, follow-up, or disqualify with structured notes.",
      href: `${b}/consult`,
      icon: Stethoscope,
      patientMirror: "Patient waits for outcome + notifications",
      videoNote: "5B is additive to Path A: Path A = scheduled at enrollment; 5B = you pull them into video from async.",
    },
    {
      id: "outcomes",
      phase: "Fulfillment",
      title: "Outcomes",
      detail: "Pharmacy dispatch, video completion, or refund / cancel path.",
      href: `${b}/erx`,
      icon: GitBranch,
      patientMirror: "Rx, ship, track",
    },
    {
      id: "notify",
      phase: "Fulfillment",
      title: "Notifications",
      detail: "Email/SMS/push via platform hooks when status or zoom changes.",
      href: `${b}/notifications`,
      icon: Bell,
    },
    {
      id: "timeline",
      phase: "Ops",
      title: "Status timeline",
      detail: "Order timeline mirrors patient portal steps for support continuity.",
      href: `${b}/queue`,
      icon: Activity,
      patientMirror: "My Orders timeline",
    },
    {
      id: "registry",
      phase: "Ops",
      title: "Patient registry",
      detail: "Longitudinal view: active meds, refills, last visit.",
      href: `${b}/patients`,
      icon: Database,
    },
    {
      id: "refill",
      phase: "Ops",
      title: "Refill workflow",
      detail: "Refill-eligible orders surface in queue with interval context.",
      href: `${b}/queue`,
      icon: RefreshCw,
      patientMirror: "Refill request from Shop / orders",
    },
  ];
}
