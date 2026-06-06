/**
 * Doctor secure messaging — thread aggregation and helpers.
 * Canonical route: /doctor/messages (https://www.peak-health.io/doctor/messages)
 */

import { doctorMessagesHref } from "./doctorPortalBase";

export { doctorMessagesHref };

export type MessageProfile = {
  id: string;
  full_name: string | null;
  role: string | null;
};

export type RawMessageRow = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  sender?: MessageProfile | null;
  receiver?: MessageProfile | null;
};

export type MessageThread = {
  id: string;
  name: string;
  role: string;
  lastMsg: string;
  lastAt: string;
  timeLabel: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
};

export type PatientContact = {
  userId: string;
  name: string;
  primaryOrderId?: string;
  orderNumber?: string;
  status?: string;
};

export function formatMessageTime(dateVal?: string | null): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatThreadTime(dateVal?: string | null): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function initials(name?: string | null): string {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function buildThreadsFromMessages(rows: RawMessageRow[], currentUserId: string): MessageThread[] {
  const threadMap: Record<string, MessageThread> = {};
  for (const msg of rows) {
    const otherProfile = msg.sender_id === currentUserId ? msg.receiver : msg.sender;
    const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
    if (!otherId) continue;
    const role = (otherProfile?.role || "").toLowerCase();
    if (role !== "patient") continue;

    if (!threadMap[otherId]) {
      threadMap[otherId] = {
        id: otherId,
        name: otherProfile?.full_name || "Unknown",
        role: otherProfile?.role || "patient",
        lastMsg: msg.content,
        lastAt: msg.created_at,
        timeLabel: formatThreadTime(msg.created_at),
        unread: 0,
      };
    }
    if (msg.receiver_id === currentUserId && !msg.is_read) {
      threadMap[otherId].unread += 1;
    }
  }
  return Object.values(threadMap).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
  );
}

export type PlatformMessageThread = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  lastMsg: string;
  lastAt: string;
  timeLabel: string;
  unread: number;
};

/** Group patient↔doctor threads for super-admin platform oversight. */
export function buildPlatformThreadsFromMessages(rows: RawMessageRow[]): PlatformMessageThread[] {
  const threadMap: Record<string, PlatformMessageThread> = {};

  for (const msg of rows) {
    const senderRole = (msg.sender?.role || "").toLowerCase();
    const receiverRole = (msg.receiver?.role || "").toLowerCase();

    let patientId: string | null = null;
    let patientName = "Patient";
    let doctorId: string | null = null;
    let doctorName = "Doctor";

    if (senderRole === "patient") {
      patientId = msg.sender_id;
      patientName = msg.sender?.full_name || "Patient";
      doctorId = msg.receiver_id;
      doctorName = msg.receiver?.full_name || "Doctor";
    } else if (receiverRole === "patient") {
      patientId = msg.receiver_id;
      patientName = msg.receiver?.full_name || "Patient";
      doctorId = msg.sender_id;
      doctorName = msg.sender?.full_name || "Doctor";
    } else {
      continue;
    }

    if (!patientId || !doctorId) continue;

    const key = `${patientId}::${doctorId}`;
    if (!threadMap[key]) {
      threadMap[key] = {
        id: key,
        patientId,
        patientName,
        doctorId,
        doctorName,
        lastMsg: msg.content,
        lastAt: msg.created_at,
        timeLabel: formatThreadTime(msg.created_at),
        unread: 0,
      };
    }

    if (!msg.is_read && msg.receiver_id === doctorId) {
      threadMap[key].unread += 1;
    }
  }

  return Object.values(threadMap).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
  );
}

export function buildPatientContacts(
  orders: {
    id?: string;
    user_id?: string | null;
    patient_name?: string | null;
    order_number?: string | null;
    status?: string | null;
  }[],
): PatientContact[] {
  const map = new Map<string, PatientContact>();
  for (const o of orders) {
    if (!o.user_id) continue;
    if (!map.has(o.user_id)) {
      map.set(o.user_id, {
        userId: o.user_id,
        name: o.patient_name || "Patient",
        primaryOrderId: o.id,
        orderNumber: o.order_number || undefined,
        status: o.status || undefined,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export const QUICK_REPLIES = [
  "Thank you for your message. I will review your chart and respond shortly.",
  "Please upload any recent lab results or imaging through your patient portal.",
  "Your prescription has been sent to the pharmacy. Contact us if you have questions.",
  "Please schedule a follow-up visit when convenient — we can arrange video if needed.",
];

export const ROLE_BADGE: Record<string, string> = {
  patient: "bg-emerald-100 text-emerald-800 border-emerald-200",
  doctor: "bg-violet-100 text-violet-800 border-violet-200",
  physician: "bg-violet-100 text-violet-800 border-violet-200",
  admin: "bg-slate-100 text-slate-700 border-slate-200",
  staff: "bg-sky-100 text-sky-800 border-sky-200",
};
