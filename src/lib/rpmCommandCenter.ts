/**
 * RPM clinical command center — aggregates vital_readings + orders for live ops UI.
 */

import {
  latestReading,
  readingStatus,
  trendSeries,
  worstStatus,
  type VitalReading,
  type VitalStatus,
} from "./vitalsClinical";
import {
  buildBpTrend,
  buildRpmRoster,
  buildSingleMetricTrend,
  CONNECTIVITY_STYLES,
  filterReadingsByRange,
  readingsForPatient,
  type RpmPatient,
  type RpmTimeRange,
  timeAgo,
  sourceDisplay,
  METRIC_LABEL,
} from "./doctorRpm";
import { resolvePatientDisplayName } from "./profileLookup";
import { parseIntakeVitals, type IntakeVitals } from "./vitalsClinical";

export type { RpmTimeRange, RpmPatient };
export {
  buildBpTrend,
  buildSingleMetricTrend,
  CONNECTIVITY_STYLES,
  METRIC_LABEL,
  readingsForPatient,
  RPM_METRIC_OPTIONS,
  sourceDisplay,
  timeAgo,
} from "./doctorRpm";

export type RpmSeverity = "normal" | "warning" | "critical";
export type RpmRiskLevel = "low" | "moderate" | "high" | "critical";
export type RpmAlertTier = "critical" | "warning" | "info";

export type RpmOrderRow = {
  id: string;
  user_id: string | null;
  patient_name: string;
  patient_vitals: unknown;
  medication?: string | null;
  category?: string | null;
  intake_answers?: Record<string, unknown> | null;
  zoom_status?: string | null;
  status?: string | null;
};

export type RpmLiveRow = {
  patient: RpmPatient;
  heartRate: string;
  bloodPressure: string;
  oxygen: string;
  glucose: string;
  respiratoryRate: string;
  temperature: string;
  age: string;
  severity: RpmSeverity;
  severityLabel: string;
  statusTone: import("./rpmEnterpriseUi").RpmStatusTone;
  risk: RpmRiskLevel;
  riskLabel: string;
  aiScore: number;
  compliancePct: number;
  deviceLabel: string;
  lastReading: string;
  ecgWaveform: number[];
};

export type RpmAlert = {
  id: string;
  tier: RpmAlertTier;
  patientKey: string;
  patientName: string;
  title: string;
  detail: string;
  metric?: string;
  value?: string;
  recordedAt: string;
  readingId?: string;
  escalated?: boolean;
};

export type RpmCommandStats = {
  activePatients: number;
  criticalAlerts: number;
  devicesConnected: number;
  avgCompliance: number;
  highRiskPatients: number;
  liveConsultations: number;
  syncsInRange: number;
  stablePct: number;
  emergencyEscalationsToday: number;
  clinicalRiskFlags: number;
};

export type RpmDeviceFleetItem = {
  source: string;
  label: string;
  syncCount: number;
  patientCount: number;
  status: "online" | "idle" | "offline";
  lastSync: string | null;
};

export type RpmTimelineEvent = {
  id: string;
  at: string;
  type: "reading" | "alert" | "sync" | "visit";
  label: string;
  detail: string;
  tier?: RpmAlertTier;
};

const SEVERITY_RANK: Record<RpmSeverity, number> = { normal: 0, warning: 1, critical: 2 };
const RISK_RANK: Record<RpmRiskLevel, number> = { low: 0, moderate: 1, high: 2, critical: 3 };

export const SEVERITY_STYLES: Record<
  RpmSeverity,
  { label: string; badge: string; row: string; dot: string }
> = {
  normal: {
    label: "Normal",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    row: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  warning: {
    label: "Warning",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    row: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  critical: {
    label: "Critical",
    badge: "bg-red-100 text-red-800 border-red-200 animate-pulse",
    row: "border-l-red-600",
    dot: "bg-red-500 animate-pulse",
  },
};

export const RISK_STYLES: Record<RpmRiskLevel, { label: string; badge: string }> = {
  low: { label: "Low risk", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  moderate: { label: "Moderate", badge: "bg-sky-100 text-sky-800 border-sky-200" },
  high: { label: "High risk", badge: "bg-orange-100 text-orange-900 border-orange-200" },
  critical: { label: "Critical", badge: "bg-red-100 text-red-900 border-red-300" },
};

export const ALERT_TIER_STYLES: Record<RpmAlertTier, string> = {
  critical: "border-red-300 bg-gradient-to-br from-red-50 to-white",
  warning: "border-amber-200 bg-gradient-to-br from-amber-50/80 to-white",
  info: "border-slate-200 bg-white",
};

function fmtMetric(metric: string, value: number, unit?: string | null): string {
  if (metric === "bp_sys" || metric === "bp_dia") return `${value}`;
  if (metric === "spo2") return `${value}%`;
  if (metric === "glucose") return `${value} mg/dL`;
  if (metric === "hr") return `${value} bpm`;
  return unit ? `${value} ${unit}` : String(value);
}

function patientSeverity(patientReadings: VitalReading[], patient: RpmPatient): RpmSeverity {
  if (patient.connectivity === "offline" && patient.readingsInRange === 0) return "warning";
  if (patient.alertCountInRange > 0) return "critical";

  const hr = latestReading(patientReadings, ["hr"]);
  const sys = latestReading(patientReadings, ["bp_sys"]);
  const dia = latestReading(patientReadings, ["bp_dia"]);
  const spo2 = latestReading(patientReadings, ["spo2"]);
  const glucose = latestReading(patientReadings, ["glucose"]);

  let worst: VitalStatus = "unknown";
  for (const r of [hr, sys, dia, spo2, glucose]) {
    if (!r) continue;
    worst = worstStatus(worst, readingStatus(r.metric, Number(r.value), r.flagged));
  }
  if (worst === "alert" || worst === "high") return "critical";
  if (worst === "elevated" || worst === "low") return "warning";
  if (patient.connectivity === "offline") return "warning";
  return "normal";
}

export function computeClinicalRisk(
  patient: RpmPatient,
  patientReadings: VitalReading[],
  range: RpmTimeRange,
): { level: RpmRiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (patient.alertCountInRange > 0) {
    score += 3;
    reasons.push(`${patient.alertCountInRange} flagged reading(s) in range`);
  }
  if (patient.connectivity === "offline") {
    score += 2;
    reasons.push("No recent device sync");
  } else if (patient.connectivity === "stale") {
    score += 1;
    reasons.push("Stale device connection");
  }

  const sev = patientSeverity(patientReadings, patient);
  if (sev === "critical") {
    score += 3;
    reasons.push("Vitals outside safe range");
  } else if (sev === "warning") {
    score += 1;
  }

  const flagged7 = patientReadings.filter((r) => r.flagged).length;
  if (flagged7 >= 3) {
    score += 2;
    reasons.push("Multiple abnormal trends");
  }

  const level: RpmRiskLevel =
    score >= 5 ? "critical" : score >= 3 ? "high" : score >= 1 ? "moderate" : "low";

  return { level, reasons: reasons.slice(0, 4) };
}

/** @deprecated use computeClinicalRisk */
export const computeAiRisk = computeClinicalRisk;

const ESC_KEY = "peak_rpm_escalated";

export function loadEscalatedPatients(): Set<string> {
  try {
    const raw = localStorage.getItem(ESC_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveEscalatedPatients(ids: Set<string>): void {
  try {
    localStorage.setItem(ESC_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function escalatePatient(key: string): void {
  const s = loadEscalatedPatients();
  s.add(key);
  saveEscalatedPatients(s);
}

function parseAge(order: RpmOrderRow | undefined, intake: IntakeVitals | null): string {
  const ans = order?.intake_answers || {};
  const age = ans.age ?? ans.patient_age;
  if (typeof age === "number") return `${age}`;
  if (typeof age === "string" && age.trim()) return age.trim();
  return "—";
}

export function computeStatusTone(
  patient: RpmPatient,
  patientReadings: VitalReading[],
  risk: RpmRiskLevel,
  escalated: Set<string>,
): import("./rpmEnterpriseUi").RpmStatusTone {
  if (escalated.has(patient.key)) return "emergency";
  const sev = patientSeverity(patientReadings, patient);
  if (sev === "critical") return "critical";
  if (risk === "high" || risk === "critical") return "high";
  if (sev === "warning") return "warning";
  return "stable";
}

export function computeCompliance(patient: RpmPatient, range: RpmTimeRange): number {
  const days = range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const expectedPerDay = 4;
  const expected = days * expectedPerDay;
  if (!expected) return 0;
  const pct = Math.round((patient.readingsInRange / expected) * 100);
  return Math.min(100, pct);
}

export function buildLiveMonitoringRows(
  roster: RpmPatient[],
  readings: VitalReading[],
  range: RpmTimeRange,
  ordersByKey?: Map<string, RpmOrderRow>,
  escalated?: Set<string>,
): RpmLiveRow[] {
  const esc = escalated ?? loadEscalatedPatients();
  return roster.map((patient) => {
    const pr = readingsForPatient(readings, patient, range);
    const hr = latestReading(pr, ["hr"]);
    const sys = latestReading(pr, ["bp_sys"]);
    const dia = latestReading(pr, ["bp_dia"]);
    const spo2 = latestReading(pr, ["spo2"]);
    const glucose = latestReading(pr, ["glucose"]);
    const resp = latestReading(pr, ["resp_rate", "rr"]);
    const temp = latestReading(pr, ["temp", "temperature"]);
    const severity = patientSeverity(pr, patient);
    const risk = computeClinicalRisk(patient, pr, range);
    const conn = CONNECTIVITY_STYLES[patient.connectivity];
    const order =
      (patient.order_id && ordersByKey?.get(`order:${patient.order_id}`)) ||
      (patient.patient_id && ordersByKey?.get(`user:${patient.patient_id}`)) ||
      undefined;
    const statusTone = computeStatusTone(patient, pr, risk.level, esc);
    const aiScore =
      risk.level === "critical" ? 92 : risk.level === "high" ? 78 : risk.level === "moderate" ? 58 : 32;

    return {
      patient,
      heartRate: hr ? `${hr.value} bpm` : "—",
      bloodPressure: sys && dia ? `${sys.value}/${dia.value}` : sys ? `${sys.value}/—` : dia ? `—/${dia.value}` : "—",
      oxygen: spo2 ? `${spo2.value}%` : "—",
      glucose: glucose ? `${glucose.value} mg/dL` : "—",
      respiratoryRate: resp ? `${resp.value} /min` : "—",
      temperature: temp ? `${temp.value}°` : patient.intake?.temp_f != null ? `${patient.intake.temp_f}°F` : "—",
      age: parseAge(order, patient.intake),
      severity,
      severityLabel: SEVERITY_STYLES[severity].label,
      statusTone,
      risk: risk.level,
      riskLabel: RISK_STYLES[risk.level].label,
      aiScore,
      compliancePct: computeCompliance(patient, range),
      deviceLabel: conn.label,
      lastReading: timeAgo(patient.lastSyncAt),
      ecgWaveform: sparklineFromReadings(pr, "hr").length >= 2 ? sparklineFromReadings(pr, "hr") : [68, 72, 70, 75, 73, 78, 76, 74],
    };
  });
}

export function buildOrdersLookup(orders: RpmOrderRow[]): Map<string, RpmOrderRow> {
  const m = new Map<string, RpmOrderRow>();
  for (const o of orders) {
    m.set(`order:${o.id}`, o);
    if (o.user_id) m.set(`user:${o.user_id}`, o);
  }
  return m;
}

export function buildAlertsEngine(
  roster: RpmPatient[],
  readings: VitalReading[],
  range: RpmTimeRange,
): RpmAlert[] {
  const scoped = filterReadingsByRange(readings, range);
  const alerts: RpmAlert[] = [];

  for (const r of scoped) {
    const st = readingStatus(r.metric, Number(r.value), r.flagged);
    const key = r.patient_id || r.patient_name || "unknown";
    const tier: RpmAlertTier =
      r.flagged || st === "alert" || st === "high" ? "critical" : st === "elevated" || st === "low" ? "warning" : "info";

    const rosterMatch =
      roster.find((p) => p.key === key || p.patient_id === r.patient_id || p.patient_name === r.patient_name) ??
      null;

    alerts.push({
      id: r.id,
      tier,
      patientKey: key,
      patientName: resolvePatientDisplayName({
        userId: r.patient_id,
        orderPatientName: rosterMatch?.patient_name || r.patient_name,
      }),
      title: tier === "critical" ? "Critical vital" : tier === "warning" ? "Abnormal vital" : "Device reading",
      detail: `${METRIC_LABEL[r.metric] || r.metric}: ${fmtMetric(r.metric, Number(r.value), r.unit)}`,
      metric: r.metric,
      value: fmtMetric(r.metric, Number(r.value), r.unit),
      recordedAt: r.recorded_at,
      readingId: r.id,
    });
  }

  for (const p of roster) {
    if (p.connectivity === "offline" && p.readingsInRange > 0) {
      alerts.push({
        id: `offline-${p.key}`,
        tier: "warning",
        patientKey: p.key,
        patientName: p.patient_name,
        title: "Device offline",
        detail: "No sync in the last 24 hours — patient may need outreach.",
        recordedAt: p.lastSyncAt || new Date().toISOString(),
      });
    }
    if (p.connectivity === "offline" && p.readingsInRange === 0) {
      alerts.push({
        id: `missed-${p.key}`,
        tier: "info",
        patientKey: p.key,
        patientName: p.patient_name,
        title: "Missed readings",
        detail: "No telemetry in selected window — check device pairing or adherence.",
        recordedAt: new Date().toISOString(),
      });
    }
    const comp = computeCompliance(p, range);
    if (comp < 40 && p.readingsInRange > 0) {
      alerts.push({
        id: `adherence-${p.key}`,
        tier: "warning",
        patientKey: p.key,
        patientName: p.patient_name,
        title: "Low adherence",
        detail: `Compliance ~${comp}% in this period.`,
        recordedAt: p.lastSyncAt || new Date().toISOString(),
      });
    }
  }

  const tierOrder: Record<RpmAlertTier, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort(
    (a, b) =>
      tierOrder[a.tier] - tierOrder[b.tier] ||
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );
}

export function computeCommandStats(
  roster: RpmPatient[],
  readings: VitalReading[],
  orders: RpmOrderRow[],
  range: RpmTimeRange,
): RpmCommandStats {
  const scoped = filterReadingsByRange(readings, range);
  const liveDevices = roster.filter((p) => p.connectivity === "live" || p.connectivity === "recent").length;
  const criticalAlerts = buildAlertsEngine(roster, readings, range).filter((a) => a.tier === "critical").length;
  const withReadings = roster.filter((p) => p.readingsInRange > 0);
  const avgCompliance = withReadings.length
    ? Math.round(withReadings.reduce((s, p) => s + computeCompliance(p, range), 0) / withReadings.length)
    : 0;
  let highRisk = 0;
  for (const p of roster) {
    const pr = readingsForPatient(readings, p, range);
    if (computeAiRisk(p, pr, range).level === "high" || computeAiRisk(p, pr, range).level === "critical") {
      highRisk += 1;
    }
  }
  const liveConsultations = orders.filter((o) =>
    ["requested", "confirmed", "rescheduled"].includes(o.zoom_status || ""),
  ).length;
  const stablePatients = roster.filter((p) => p.alertCountInRange === 0 && p.readingsInRange > 0).length;
  const stablePct = roster.length ? Math.round((stablePatients / roster.length) * 100) : 100;

  const escalated = loadEscalatedPatients();
  const emergencyEscalationsToday = escalated.size;
  const clinicalRiskFlags = roster.filter((p) => {
    const pr = readingsForPatient(readings, p, range);
    const lvl = computeClinicalRisk(p, pr, range).level;
    return lvl === "moderate" || lvl === "high" || lvl === "critical";
  }).length;

  return {
    activePatients: roster.length,
    criticalAlerts,
    devicesConnected: liveDevices,
    avgCompliance,
    highRiskPatients: highRisk,
    liveConsultations,
    syncsInRange: scoped.length,
    stablePct,
    emergencyEscalationsToday,
    clinicalRiskFlags,
  };
}

export function buildDeviceFleet(readings: VitalReading[], range: RpmTimeRange): RpmDeviceFleetItem[] {
  const scoped = filterReadingsByRange(readings, range);
  const bySource = new Map<string, { count: number; patients: Set<string>; last: string | null }>();

  for (const r of scoped) {
    const src = r.source || "unknown";
    const cur = bySource.get(src) ?? { count: 0, patients: new Set(), last: null };
    cur.count += 1;
    if (r.patient_id) cur.patients.add(r.patient_id);
    else if (r.patient_name) cur.patients.add(r.patient_name);
    if (!cur.last || new Date(r.recorded_at) > new Date(cur.last)) cur.last = r.recorded_at;
    bySource.set(src, cur);
  }

  return Array.from(bySource.entries())
    .map(([source, v]) => {
      const mins = v.last ? (Date.now() - new Date(v.last).getTime()) / 60000 : Infinity;
      const status: RpmDeviceFleetItem["status"] =
        mins <= 60 ? "online" : mins <= 24 * 60 ? "idle" : "offline";
      return {
        source,
        label: sourceDisplay(source),
        syncCount: v.count,
        patientCount: v.patients.size,
        status,
        lastSync: v.last,
      };
    })
    .sort((a, b) => b.syncCount - a.syncCount);
}

export function buildPatientTimeline(
  patient: RpmPatient,
  patientReadings: VitalReading[],
  alerts: RpmAlert[],
): RpmTimelineEvent[] {
  const events: RpmTimelineEvent[] = [];

  for (const r of patientReadings.slice(0, 40)) {
    events.push({
      id: `r-${r.id}`,
      at: r.recorded_at,
      type: r.flagged ? "alert" : "reading",
      label: METRIC_LABEL[r.metric] || r.metric,
      detail: `${fmtMetric(r.metric, Number(r.value), r.unit)} · ${sourceDisplay(r.source)}`,
      tier: r.flagged ? "critical" : undefined,
    });
  }

  for (const a of alerts.filter((x) => x.patientKey === patient.key).slice(0, 8)) {
    events.push({
      id: `a-${a.id}`,
      at: a.recordedAt,
      type: "alert",
      label: a.title,
      detail: a.detail,
      tier: a.tier,
    });
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 24);
}

export function sortLiveRows(rows: RpmLiveRow[], key: string, dir: "asc" | "desc"): RpmLiveRow[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (key) {
      case "patient":
        return mul * a.patient.patient_name.localeCompare(b.patient.patient_name);
      case "severity":
        return mul * (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
      case "risk":
        return mul * (RISK_RANK[a.risk] - RISK_RANK[b.risk]);
      case "compliance":
        return mul * (a.compliancePct - b.compliancePct);
      case "last":
        return (
          mul *
          ((a.patient.lastSyncAt ? new Date(a.patient.lastSyncAt).getTime() : 0) -
            (b.patient.lastSyncAt ? new Date(b.patient.lastSyncAt).getTime() : 0))
        );
      default:
        return 0;
    }
  });
}

export function sparklineFromReadings(readings: VitalReading[], metric: string): number[] {
  return trendSeries(readings, metric, 8).map((p) => p.v);
}

const ACK_KEY = "peak_rpm_ack_alerts";

export function loadAcknowledgedAlerts(): Set<string> {
  try {
    const raw = localStorage.getItem(ACK_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveAcknowledgedAlerts(ids: Set<string>): void {
  try {
    localStorage.setItem(ACK_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function orderContextFromRow(o: RpmOrderRow): {
  medication: string;
  category: string;
  allergies: string;
  intake: IntakeVitals | null;
} {
  const intake = parseIntakeVitals(o.patient_vitals);
  const ans = o.intake_answers || {};
  const allergies =
    (typeof ans.allergies === "string" ? ans.allergies : null) ||
    intake?.allergies ||
    "None documented";
  return {
    medication: o.medication || "—",
    category: o.category || "General",
    allergies: String(allergies),
    intake,
  };
}
