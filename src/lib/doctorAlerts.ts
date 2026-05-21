/**
 * Doctor alerts & notifications — DB inbox + synthesized clinical alerts.
 */

import { doctorMessagesHref } from "./doctorPortalBase";

import type { Order } from "./patient-store";

export type AlertSeverity = "critical" | "high" | "normal" | "info";

export type DbNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  unread: boolean;
  created_at: string;
};

export type VitalFlagRow = {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  metric: string;
  value: number;
  unit: string | null;
  recorded_at: string;
};

export type AlertFeedItem = {
  id: string;
  source: "notification" | "clinical";
  severity: AlertSeverity;
  category: string;
  title: string;
  body: string;
  createdAt: string;
  unread: boolean;
  actionTo: string;
  actionLabel: string;
  notificationId?: string;
};

export const NOTIFICATION_TYPE_STYLES: Record<string, { badge: string; label: string }> = {
  appointment: { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Appointment" },
  lab: { badge: "bg-blue-100 text-blue-800 border-blue-200", label: "Lab" },
  message: { badge: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "Message" },
  prescription: { badge: "bg-amber-100 text-amber-800 border-amber-200", label: "Rx" },
  security: { badge: "bg-red-100 text-red-800 border-red-200", label: "Security" },
  video_consult: { badge: "bg-violet-100 text-violet-800 border-violet-200", label: "Video" },
  clinical: { badge: "bg-slate-100 text-slate-800 border-slate-200", label: "Clinical" },
  other: { badge: "bg-slate-100 text-slate-700 border-slate-200", label: "System" },
};

export const SEVERITY_STYLES: Record<AlertSeverity, { badge: string; dot: string; border: string }> = {
  critical: { badge: "bg-red-600 text-white border-red-700", dot: "bg-red-500 animate-pulse", border: "border-red-200" },
  high: { badge: "bg-amber-500 text-white border-amber-600", dot: "bg-amber-500", border: "border-amber-200" },
  normal: { badge: "bg-emerald-600 text-white border-emerald-700", dot: "bg-emerald-500", border: "border-emerald-100" },
  info: { badge: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-400", border: "border-slate-100" },
};

const METRIC_LABEL: Record<string, string> = {
  bp_sys: "Systolic BP",
  bp_dia: "Diastolic BP",
  hr: "Heart rate",
  spo2: "SpO₂",
  glucose: "Glucose",
};

export function dbNotificationToFeedItem(n: DbNotification, doctorBase: string): AlertFeedItem {
  const type = n.type || "other";
  let actionTo = `${doctorBase}/notifications`;
  let actionLabel = "View";
  if (type === "message") {
    actionTo = doctorMessagesHref(doctorBase);
    actionLabel = "Open messages";
  } else if (type === "appointment") {
    actionTo = `${doctorBase}/schedule`;
    actionLabel = "Schedule";
  } else if (type === "lab") {
    actionTo = `${doctorBase}/labs`;
    actionLabel = "Labs";
  } else if (type === "prescription") {
    actionTo = `${doctorBase}/erx`;
    actionLabel = "e-Rx";
  }
  return {
    id: `notif-${n.id}`,
    source: "notification",
    severity: type === "security" ? "critical" : type === "video_consult" ? "high" : "normal",
    category: NOTIFICATION_TYPE_STYLES[type]?.label || "Notification",
    title: n.title,
    body: n.body,
    createdAt: n.created_at,
    unread: n.unread,
    actionTo,
    actionLabel,
    notificationId: n.id,
  };
}

export function buildClinicalAlerts(
  orders: Order[],
  flaggedVitals: VitalFlagRow[],
  unreadMessages: number,
  doctorBase: string,
): AlertFeedItem[] {
  const items: AlertFeedItem[] = [];
  const seen = new Set<string>();

  for (const o of orders) {
    if (o.status === "medical_review" || o.status === "order_submitted") {
      const key = `review-${o.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({
          id: key,
          source: "clinical",
          severity: o.urgent ? "critical" : "high",
          category: "Queue",
          title: `Physician review — ${o.patientName}`,
          body: `${o.medication || "Consultation"} · ${(o.status || "").replace(/_/g, " ")}`,
          createdAt: o.created_at || o.orderedDate || new Date().toISOString(),
          unread: true,
          actionTo: `${doctorBase}/consult?orderId=${encodeURIComponent(o.order_number || o.id)}`,
          actionLabel: "Open case",
        });
      }
    }
    if (o.enrollmentVideoRequired || o.zoom_status === "requested") {
      const key = `video-${o.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({
          id: key,
          source: "clinical",
          severity: "high",
          category: "Video",
          title: `Video visit — ${o.patientName}`,
          body: o.zoom_status === "requested" ? "Patient scheduling pending confirmation." : "Enrollment requires synchronous video.",
          createdAt: o.created_at || o.orderedDate || new Date().toISOString(),
          unread: true,
          actionTo: `${doctorBase}/consult?orderId=${encodeURIComponent(o.order_number || o.id)}`,
          actionLabel: "Consult",
        });
      }
    }
  }

  for (const v of flaggedVitals.slice(0, 15)) {
    items.push({
      id: `vital-${v.id}`,
      source: "clinical",
      severity: "critical",
      category: "Vitals",
      title: `Critical vital — ${v.patient_name || "Patient"}`,
      body: `${METRIC_LABEL[v.metric] || v.metric}: ${v.value}${v.unit ? ` ${v.unit}` : ""}`,
      createdAt: v.recorded_at,
      unread: true,
      actionTo: `${doctorBase}/vitals`,
      actionLabel: "Vitals hub",
    });
  }

  if (unreadMessages > 0) {
    items.push({
      id: "clinical-messages",
      source: "clinical",
      severity: "normal",
      category: "Messages",
      title: `${unreadMessages} unread secure message${unreadMessages !== 1 ? "s" : ""}`,
      body: "Patient or care-team messages awaiting your response.",
      createdAt: new Date().toISOString(),
      unread: true,
      actionTo: doctorMessagesHref(doctorBase),
      actionLabel: "Inbox",
    });
  }

  return items;
}

export function mergeAlertFeed(
  notifications: DbNotification[],
  clinical: AlertFeedItem[],
  doctorBase: string,
): AlertFeedItem[] {
  const dbItems = notifications.map((n) => dbNotificationToFeedItem(n, doctorBase));
  const all = [...dbItems, ...clinical];
  const rank: Record<AlertSeverity, number> = { critical: 4, high: 3, normal: 2, info: 1 };
  return all.sort((a, b) => {
    const sev = rank[b.severity] - rank[a.severity];
    if (sev !== 0) return sev;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function formatAlertTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
