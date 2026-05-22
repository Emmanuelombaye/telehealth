/**
 * Physician analytics & insights — clinical KPIs from orders + supplemental tables.
 */

import { downloadBrandedReportPdf } from "./brandedExport";
import type { Order, OrderStatus } from "./patient-store";
import { ORDER_STEPS } from "./patient-store";

export type AnalyticsRange = "7D" | "30D" | "90D" | "YTD";

export type SupplementalMetrics = {
  flaggedVitals: number;
  labsNew: number;
  labsPending: number;
  labsFinal: number;
  notesAuthored: number;
  prescriptionsIssued: number;
  vitalsTableMissing: boolean;
  labsTableMissing: boolean;
};

export type TrendPoint = { label: string; encounters: number; cleared: number; urgent: number };

export type StatusSlice = { status: string; label: string; count: number; fill: string };

export type NamedCount = { name: string; value: number };

export type PhysicianInsight = {
  id: string;
  severity: "info" | "warning" | "success";
  title: string;
  body: string;
  actionTo?: string;
  actionLabel?: string;
};

export type PhysicianAnalytics = {
  range: AnalyticsRange;
  periodLabel: string;
  encounters: number;
  encountersTrendPct: number;
  uniquePatients: number;
  pendingQueue: number;
  clearanceRatePct: number;
  avgWaitMins: number;
  waitTrendMins: number;
  videoRatePct: number;
  intakeCompletePct: number;
  urgentCount: number;
  volumeSeries: TrendPoint[];
  statusPipeline: StatusSlice[];
  categoryBreakdown: NamedCount[];
  topMedications: NamedCount[];
  supplemental: SupplementalMetrics;
  insights: PhysicianInsight[];
};

const STATUS_COLORS: Record<string, string> = {
  order_submitted: "#94a3b8",
  account_created: "#64748b",
  id_verified: "#0ea5e9",
  intake_completed: "#06b6d4",
  medical_review: "#f59e0b",
  rx_sent: "#10b981",
  shipped: "#059669",
  delivered: "#047857",
  follow_up: "#f43f5e",
  refill_eligible: "#8b5cf6",
};

const CLEARED_STATUSES = new Set<OrderStatus>(["rx_sent", "shipped", "delivered"]);
const QUEUE_STATUSES = new Set<OrderStatus>(["order_submitted", "medical_review", "follow_up"]);

export function orderTimestamp(o: Order): number {
  if (o.created_at) return new Date(o.created_at).getTime();
  if (o.orderedDate) {
    const p = new Date(o.orderedDate);
    if (!isNaN(p.getTime())) return p.getTime();
  }
  return 0;
}

export function rangeStart(range: AnalyticsRange, now = new Date()): Date {
  const d = new Date(now);
  if (range === "7D") d.setDate(d.getDate() - 7);
  else if (range === "30D") d.setDate(d.getDate() - 30);
  else if (range === "90D") d.setDate(d.getDate() - 90);
  else d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function priorRangeStart(range: AnalyticsRange, start: Date): Date {
  const span = Date.now() - start.getTime();
  return new Date(start.getTime() - span);
}

export function filterOrdersInRange(orders: Order[], start: Date, end = new Date()): Order[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return orders.filter((o) => {
    const t = orderTimestamp(o);
    return t >= startMs && t <= endMs;
  });
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function bucketKey(d: Date, range: AnalyticsRange): string {
  if (range === "90D" || range === "YTD") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initBuckets(range: AnalyticsRange, start: Date, now: Date): Record<string, TrendPoint> {
  const map: Record<string, TrendPoint> = {};
  if (range === "90D" || range === "YTD") {
    let m = start.getMonth();
    let y = start.getFullYear();
    const endM = now.getMonth();
    const endY = now.getFullYear();
    while (y < endY || (y === endY && m <= endM)) {
      const d = new Date(y, m, 1);
      const key = bucketKey(d, range);
      map[key] = { label: key, encounters: 0, cleared: 0, urgent: 0 };
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return map;
  }
  const days = range === "7D" ? 7 : 30;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = bucketKey(d, range);
    map[key] = { label: key, encounters: 0, cleared: 0, urgent: 0 };
  }
  return map;
}

function countByField(orders: Order[], field: keyof Order, limit = 8): NamedCount[] {
  const counts: Record<string, number> = {};
  for (const o of orders) {
    const raw = o[field];
    const key = (typeof raw === "string" && raw.trim() ? raw : "Unknown") as string;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function buildPhysicianAnalytics(
  orders: Order[],
  range: AnalyticsRange,
  supplemental: SupplementalMetrics,
  doctorBase: string,
): PhysicianAnalytics {
  const now = new Date();
  const start = rangeStart(range, now);
  const prevStart = priorRangeStart(range, start);

  const current = filterOrdersInRange(orders, start, now);
  const previous = filterOrdersInRange(orders, prevStart, start);

  const encounters = current.length;
  const prevEncounters = previous.length;
  const encountersTrendPct = pctChange(encounters, prevEncounters);

  const uniquePatients = new Set(
    current.map((o) => o.userId || o.user_id || o.patientName).filter(Boolean),
  ).size;

  const pendingQueue = orders.filter((o) => QUEUE_STATUSES.has(o.status)).length;
  const cleared = current.filter((o) => CLEARED_STATUSES.has(o.status)).length;
  const clearanceRatePct = encounters ? Math.round((cleared / encounters) * 100) : 0;

  const waitSamples = current.filter((o) => (o.waitMins ?? 0) > 0);
  const prevWaitSamples = previous.filter((o) => (o.waitMins ?? 0) > 0);
  const avgWaitMins = waitSamples.length
    ? Math.round(waitSamples.reduce((s, o) => s + (o.waitMins || 0), 0) / waitSamples.length)
    : 0;
  const prevAvgWait = prevWaitSamples.length
    ? Math.round(prevWaitSamples.reduce((s, o) => s + (o.waitMins || 0), 0) / prevWaitSamples.length)
    : 0;
  const waitTrendMins = avgWaitMins - prevAvgWait;

  const videoCount = current.filter(
    (o) =>
      o.zoom_status === "confirmed" ||
      o.zoom_status === "requested" ||
      o.enrollmentVideoRequired,
  ).length;
  const videoRatePct = encounters ? Math.round((videoCount / encounters) * 100) : 0;

  const intakeDone = current.filter((o) => o.intakeComplete).length;
  const intakeCompletePct = encounters ? Math.round((intakeDone / encounters) * 100) : 0;

  const urgentCount = current.filter((o) => o.urgent).length;

  const buckets = initBuckets(range, start, now);
  for (const o of current) {
    const d = new Date(orderTimestamp(o));
    const key = bucketKey(d, range);
    if (!buckets[key]) buckets[key] = { label: key, encounters: 0, cleared: 0, urgent: 0 };
    buckets[key].encounters += 1;
    if (CLEARED_STATUSES.has(o.status)) buckets[key].cleared += 1;
    if (o.urgent) buckets[key].urgent += 1;
  }
  const volumeSeries = Object.values(buckets);

  const statusCounts: Record<string, number> = {};
  for (const o of current) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }
  const statusPipeline: StatusSlice[] = ORDER_STEPS.map((step) => ({
    status: step.key,
    label: step.label,
    count: statusCounts[step.key] || 0,
    fill: STATUS_COLORS[step.key] || "#64748b",
  })).filter((s) => s.count > 0);

  const categoryBreakdown = countByField(current, "category", 6);
  const topMedications = countByField(current, "medication", 8);

  const insights = buildInsights({
    encounters,
    encountersTrendPct,
    pendingQueue,
    clearanceRatePct,
    avgWaitMins,
    waitTrendMins,
    urgentCount,
    supplemental,
    categoryBreakdown,
    doctorBase,
  });

  const periodLabels: Record<AnalyticsRange, string> = {
    "7D": "Last 7 days",
    "30D": "Last 30 days",
    "90D": "Last 90 days",
    YTD: "Year to date",
  };

  return {
    range,
    periodLabel: periodLabels[range],
    encounters,
    encountersTrendPct,
    uniquePatients,
    pendingQueue,
    clearanceRatePct,
    avgWaitMins,
    waitTrendMins,
    videoRatePct,
    intakeCompletePct,
    urgentCount,
    volumeSeries,
    statusPipeline,
    categoryBreakdown,
    topMedications,
    supplemental,
    insights,
  };
}

function buildInsights(ctx: {
  encounters: number;
  encountersTrendPct: number;
  pendingQueue: number;
  clearanceRatePct: number;
  avgWaitMins: number;
  waitTrendMins: number;
  urgentCount: number;
  supplemental: SupplementalMetrics;
  categoryBreakdown: NamedCount[];
  doctorBase: string;
}): PhysicianInsight[] {
  const out: PhysicianInsight[] = [];

  if (ctx.pendingQueue > 0) {
    out.push({
      id: "queue",
      severity: ctx.pendingQueue >= 5 ? "warning" : "info",
      title: `${ctx.pendingQueue} cases awaiting physician decision`,
      body: "Orders in medical review, submitted, or follow-up states need triage.",
      actionTo: `${ctx.doctorBase}/queue`,
      actionLabel: "Open queue",
    });
  }

  if (ctx.encountersTrendPct !== 0) {
    out.push({
      id: "volume",
      severity: ctx.encountersTrendPct > 0 ? "success" : "info",
      title: `Encounter volume ${ctx.encountersTrendPct > 0 ? "up" : "down"} ${Math.abs(ctx.encountersTrendPct)}%`,
      body: `Compared with the prior period — ${ctx.encounters} encounters in the selected window.`,
    });
  }

  if (ctx.waitTrendMins !== 0 && ctx.avgWaitMins > 0) {
    out.push({
      id: "wait",
      severity: ctx.waitTrendMins > 3 ? "warning" : "success",
      title: `Average queue wait ${ctx.avgWaitMins} min`,
      body:
        ctx.waitTrendMins > 0
          ? `Wait time increased ${ctx.waitTrendMins} min vs prior period — consider capacity review.`
          : `Wait time improved ${Math.abs(ctx.waitTrendMins)} min vs prior period.`,
      actionTo: `${ctx.doctorBase}/queue`,
      actionLabel: "Triage queue",
    });
  }

  if (ctx.urgentCount > 0) {
    out.push({
      id: "urgent",
      severity: "warning",
      title: `${ctx.urgentCount} urgent encounters`,
      body: "Flagged cases in this period — prioritize in clinical queue.",
      actionTo: `${ctx.doctorBase}/queue`,
      actionLabel: "Urgent cases",
    });
  }

  if (ctx.supplemental.flaggedVitals > 0) {
    out.push({
      id: "vitals",
      severity: "warning",
      title: `${ctx.supplemental.flaggedVitals} critical vital readings`,
      body: "Out-of-range RPM/device metrics require clinical follow-up.",
      actionTo: `${ctx.doctorBase}/vitals`,
      actionLabel: "Vitals hub",
    });
  }

  if (ctx.supplemental.labsNew + ctx.supplemental.labsPending > 0) {
    out.push({
      id: "labs",
      severity: "info",
      title: `${ctx.supplemental.labsNew + ctx.supplemental.labsPending} lab results in flight`,
      body: `${ctx.supplemental.labsFinal} finalized panels in system — review new and pending results.`,
      actionTo: `${ctx.doctorBase}/labs`,
      actionLabel: "Lab requests",
    });
  }

  const topCat = ctx.categoryBreakdown[0];
  if (topCat && ctx.encounters > 0) {
    const share = Math.round((topCat.value / ctx.encounters) * 100);
    out.push({
      id: "category",
      severity: "info",
      title: `${topCat.name} leads at ${share}%`,
      body: "Top treatment category by encounter volume in this period.",
      actionTo: `${ctx.doctorBase}/patients`,
      actionLabel: "Patient roster",
    });
  }

  if (ctx.clearanceRatePct >= 70) {
    out.push({
      id: "clearance",
      severity: "success",
      title: `${ctx.clearanceRatePct}% clearance rate`,
      body: "Share of encounters reaching prescribed, shipped, or delivered in this window.",
    });
  }

  return out.slice(0, 8);
}

export async function exportAnalyticsPdf(analytics: PhysicianAnalytics): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  await downloadBrandedReportPdf({
    filename: `physician-insights-${analytics.range}-${date}.pdf`,
    title: "Physician Insights Report",
    subtitle: `${analytics.periodLabel} · ${analytics.range}`,
    sections: [
      { kind: "heading", text: "Clinical KPIs" },
      {
        kind: "kv",
        rows: [
          ["Encounters", String(analytics.encounters)],
          ["Unique patients", String(analytics.uniquePatients)],
          ["Pending queue", String(analytics.pendingQueue)],
          ["Clearance rate", `${analytics.clearanceRatePct}%`],
          ["Avg wait", `${analytics.avgWaitMins} min`],
          ["Video rate", `${analytics.videoRatePct}%`],
          ["Intake complete", `${analytics.intakeCompletePct}%`],
          ["Urgent cases", String(analytics.urgentCount)],
          ["Flagged vitals", String(analytics.supplemental.flaggedVitals)],
          ["Notes authored", String(analytics.supplemental.notesAuthored)],
          ["Prescriptions issued", String(analytics.supplemental.prescriptionsIssued)],
        ],
      },
      { kind: "heading", text: "Encounter volume" },
      {
        kind: "table",
        headers: ["Date", "Encounters", "Cleared", "Urgent"],
        rows: analytics.volumeSeries.map((p) => [
          p.label,
          String(p.encounters),
          String(p.cleared),
          String(p.urgent),
        ]),
      },
      ...(analytics.topMedications.length
        ? [
            { kind: "heading" as const, text: "Top medications" },
            {
              kind: "table" as const,
              headers: ["Medication", "Count"],
              rows: analytics.topMedications.map((m) => [m.name, String(m.value)]),
            },
          ]
        : []),
    ],
  });
}

export const RANGE_LABELS: Record<AnalyticsRange, string> = {
  "7D": "7 days",
  "30D": "30 days",
  "90D": "90 days",
  YTD: "Year to date",
};
