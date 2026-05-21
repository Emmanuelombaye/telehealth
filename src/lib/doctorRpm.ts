/**
 * Remote Patient Monitoring — roster, device connectivity, and telemetry helpers.
 * Data: `vital_readings` + enrollment baseline from `orders.patient_vitals`.
 */

import {
  parseIntakeVitals,
  readingStatus,
  SOURCE_LABEL,
  type IntakeVitals,
  type VitalReading,
  type VitalStatus,
} from "./vitalsClinical";

export type RpmTimeRange = "24h" | "7d" | "30d" | "all";

export type RpmPatient = {
  key: string;
  patient_id: string | null;
  patient_name: string;
  order_id: string | null;
  intake: IntakeVitals | null;
  lastSyncAt: string | null;
  deviceSources: string[];
  readingsInRange: number;
  alertCountInRange: number;
  connectivity: "live" | "recent" | "stale" | "offline";
};

export const RPM_METRIC_OPTIONS = [
  { id: "bp", label: "Blood pressure", metrics: ["bp_sys", "bp_dia"] },
  { id: "hr", label: "Heart rate", metrics: ["hr"] },
  { id: "spo2", label: "SpO₂", metrics: ["spo2"] },
  { id: "glucose", label: "Glucose", metrics: ["glucose"] },
  { id: "weight", label: "Weight", metrics: ["weight"] },
  { id: "temp", label: "Temperature", metrics: ["temp", "temperature"] },
  { id: "resp", label: "Respiratory", metrics: ["resp_rate", "rr"] },
] as const;

export const METRIC_LABEL: Record<string, string> = {
  bp_sys: "Systolic BP",
  bp_dia: "Diastolic BP",
  hr: "Heart rate",
  spo2: "SpO₂",
  glucose: "Glucose",
  weight: "Weight",
  temp: "Temperature",
  temperature: "Temperature",
  resp_rate: "Respiratory rate",
  rr: "Respiratory rate",
};

export function rangeStartMs(range: RpmTimeRange): number | null {
  const now = Date.now();
  if (range === "24h") return now - 24 * 60 * 60 * 1000;
  if (range === "7d") return now - 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return now - 30 * 24 * 60 * 60 * 1000;
  return null;
}

export function filterReadingsByRange(readings: VitalReading[], range: RpmTimeRange): VitalReading[] {
  const start = rangeStartMs(range);
  if (start == null) return readings;
  return readings.filter((r) => new Date(r.recorded_at).getTime() >= start);
}

function connectivityFromLastSync(iso: string | null): RpmPatient["connectivity"] {
  if (!iso) return "offline";
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins <= 60) return "live";
  if (mins <= 24 * 60) return "recent";
  if (mins <= 7 * 24 * 60) return "stale";
  return "offline";
}

export const CONNECTIVITY_STYLES: Record<
  RpmPatient["connectivity"],
  { label: string; badge: string; dot: string }
> = {
  live: { label: "Live", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500 animate-pulse" },
  recent: { label: "Recent", badge: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  stale: { label: "Stale", badge: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  offline: { label: "Offline", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-300" },
};

export function buildRpmRoster(
  readings: VitalReading[],
  orders: { id?: string; user_id?: string | null; patient_name?: string | null; patient_vitals?: unknown }[],
  range: RpmTimeRange,
): RpmPatient[] {
  const scoped = filterReadingsByRange(readings, range);
  const map = new Map<string, RpmPatient>();

  const ensure = (key: string, patient_id: string | null, patient_name: string) => {
    if (!map.has(key)) {
      map.set(key, {
        key,
        patient_id,
        patient_name,
        order_id: null,
        intake: null,
        lastSyncAt: null,
        deviceSources: [],
        readingsInRange: 0,
        alertCountInRange: 0,
        connectivity: "offline",
      });
    }
    return map.get(key)!;
  };

  for (const o of orders) {
    const key = o.user_id || o.patient_name || "unknown";
    const row = ensure(key, o.user_id ?? null, o.patient_name || "Unknown patient");
    if (o.id && !row.order_id) row.order_id = o.id;
    if (!row.intake && o.patient_vitals) row.intake = parseIntakeVitals(o.patient_vitals);
  }

  for (const r of scoped) {
    const key = r.patient_id || r.patient_name || "unknown";
    const row = ensure(key, r.patient_id, r.patient_name || "Unknown patient");
    row.readingsInRange += 1;
    if (r.flagged) row.alertCountInRange += 1;
    if (r.source && !row.deviceSources.includes(r.source)) row.deviceSources.push(r.source);
    if (!row.lastSyncAt || new Date(r.recorded_at) > new Date(row.lastSyncAt)) {
      row.lastSyncAt = r.recorded_at;
    }
  }

  for (const row of map.values()) {
    row.connectivity = connectivityFromLastSync(row.lastSyncAt);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.alertCountInRange !== a.alertCountInRange) return b.alertCountInRange - a.alertCountInRange;
    const ta = a.lastSyncAt ? new Date(a.lastSyncAt).getTime() : 0;
    const tb = b.lastSyncAt ? new Date(b.lastSyncAt).getTime() : 0;
    return tb - ta;
  });
}

export function readingsForPatient(
  readings: VitalReading[],
  patient: RpmPatient,
  range: RpmTimeRange,
): VitalReading[] {
  const scoped = filterReadingsByRange(readings, range);
  return scoped.filter(
    (r) =>
      (patient.patient_id && r.patient_id === patient.patient_id) ||
      (patient.patient_name && r.patient_name === patient.patient_name),
  );
}

export function buildBpTrend(readings: VitalReading[], limit = 20) {
  const slice = readings
    .filter((r) => r.metric === "bp_sys" || r.metric === "bp_dia")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-limit * 2);
  const buckets: Record<string, { time: string; sys?: number; dia?: number }> = {};
  for (const r of slice) {
    const t = new Date(r.recorded_at).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    buckets[t] ||= { time: t };
    if (r.metric === "bp_sys") buckets[t].sys = Number(r.value);
    else buckets[t].dia = Number(r.value);
  }
  return Object.values(buckets).slice(-limit);
}

export function buildSingleMetricTrend(readings: VitalReading[], metrics: string[], limit = 24) {
  return readings
    .filter((r) => metrics.includes(r.metric))
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-limit)
    .map((r) => ({
      time: new Date(r.recorded_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      value: Number(r.value),
      metric: r.metric,
    }));
}

export function deviceSourceBreakdown(readings: VitalReading[], range: RpmTimeRange) {
  const scoped = filterReadingsByRange(readings, range);
  const counts = new Map<string, number>();
  for (const r of scoped) {
    const src = r.source || "unknown";
    counts.set(src, (counts.get(src) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({
      source,
      label: SOURCE_LABEL[source] || source.replace(/_/g, " "),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeRpmStats(roster: RpmPatient[], readings: VitalReading[], range: RpmTimeRange) {
  const scoped = filterReadingsByRange(readings, range);
  const liveDevices = roster.filter((p) => p.connectivity === "live" || p.connectivity === "recent").length;
  const criticalAlerts = scoped.filter((r) => r.flagged).length;
  const stablePatients = roster.filter((p) => p.alertCountInRange === 0 && p.readingsInRange > 0).length;
  const stablePct = roster.length ? Math.round((stablePatients / roster.length) * 100) : 100;
  const sources = new Set(scoped.map((r) => r.source).filter(Boolean));
  return {
    monitored: roster.length,
    liveDevices,
    criticalAlerts,
    stablePct,
    syncs: scoped.length,
    sourceCount: sources.size,
  };
}

export function readingRowStatus(r: VitalReading): VitalStatus {
  return readingStatus(r.metric, Number(r.value), r.flagged);
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export function sourceDisplay(source: string | null): string {
  if (!source) return "Unknown device";
  return SOURCE_LABEL[source] || source.replace(/_/g, " ");
}
