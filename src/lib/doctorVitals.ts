/**
 * Doctor Vitals hub — roster, time filters, trend shaping.
 */

import { parseIntakeVitals, type IntakeVitals, type VitalReading } from "./vitalsClinical";
import { rangeStartMs, type RpmTimeRange } from "./doctorRpm";

export type { RpmTimeRange as VitalsTimeRange };

export type VitalsPatientRow = {
  key: string;
  patient_id: string | null;
  patient_name: string;
  order_id: string | null;
  intake: IntakeVitals | null;
  lastReadingAt: string | null;
  readingCount: number;
  flaggedCount: number;
  hasDeviceData: boolean;
};

export const VITAL_METRIC_CHARTS = [
  { id: "bp", label: "Blood pressure", metrics: ["bp_sys", "bp_dia"], dual: true },
  { id: "hr", label: "Heart rate", metrics: ["hr"], dual: false },
  { id: "spo2", label: "SpO₂", metrics: ["spo2"], dual: false },
  { id: "glucose", label: "Glucose", metrics: ["glucose"], dual: false },
  { id: "weight", label: "Weight", metrics: ["weight"], dual: false },
  { id: "temp", label: "Temperature", metrics: ["temp", "temperature"], dual: false },
] as const;

export const CLINICAL_THRESHOLDS = [
  { metric: "Blood pressure (sys)", normal: "< 120 mmHg", elevated: "120–139", high: "≥ 140" },
  { metric: "Blood pressure (dia)", normal: "< 80 mmHg", elevated: "80–89", high: "≥ 90" },
  { metric: "Heart rate", normal: "60–90 bpm", elevated: "50–59 or 91–100", alert: "< 50 or > 100" },
  { metric: "SpO₂", normal: "≥ 95%", elevated: "92–94%", alert: "< 92%" },
  { metric: "Glucose (fasting)", normal: "70–99 mg/dL", high: "≥ 125", low: "< 70" },
  { metric: "Temperature", normal: "97–99.4°F", elevated: "≥ 99.5", high: "≥ 100.4" },
];

export function filterVitalsByRange(readings: VitalReading[], range: RpmTimeRange): VitalReading[] {
  const start = rangeStartMs(range);
  if (start == null) return readings;
  return readings.filter((r) => new Date(r.recorded_at).getTime() >= start);
}

export function buildVitalsRoster(
  readings: VitalReading[],
  orders: {
    id: string;
    user_id?: string | null;
    patient_name?: string | null;
    patient_vitals?: unknown;
  }[],
  range: RpmTimeRange,
): VitalsPatientRow[] {
  const scoped = filterVitalsByRange(readings, range);
  const map = new Map<string, VitalsPatientRow>();

  const ensure = (key: string, patient_id: string | null, patient_name: string) => {
    if (!map.has(key)) {
      map.set(key, {
        key,
        patient_id,
        patient_name,
        order_id: null,
        intake: null,
        lastReadingAt: null,
        readingCount: 0,
        flaggedCount: 0,
        hasDeviceData: false,
      });
    }
    return map.get(key)!;
  };

  for (const o of orders) {
    const key = o.user_id || o.patient_name || "unknown";
    const row = ensure(key, o.user_id ?? null, o.patient_name || "Unknown patient");
    if (!row.order_id) row.order_id = o.id;
    if (!row.intake && o.patient_vitals) row.intake = parseIntakeVitals(o.patient_vitals);
  }

  for (const r of scoped) {
    const key = r.patient_id || r.patient_name || "unknown";
    const row = ensure(key, r.patient_id, r.patient_name || "Unknown patient");
    row.readingCount += 1;
    row.hasDeviceData = true;
    if (r.flagged) row.flaggedCount += 1;
    if (!row.lastReadingAt || new Date(r.recorded_at) > new Date(row.lastReadingAt)) {
      row.lastReadingAt = r.recorded_at;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.flaggedCount !== a.flaggedCount) return b.flaggedCount - a.flaggedCount;
    const ta = a.lastReadingAt ? new Date(a.lastReadingAt).getTime() : 0;
    const tb = b.lastReadingAt ? new Date(b.lastReadingAt).getTime() : 0;
    return tb - ta;
  });
}

export function readingsForVitalsPatient(
  readings: VitalReading[],
  patient: VitalsPatientRow,
  range: RpmTimeRange,
): VitalReading[] {
  const scoped = filterVitalsByRange(readings, range);
  return scoped.filter(
    (r) =>
      (patient.patient_id && r.patient_id === patient.patient_id) ||
      (patient.patient_name && r.patient_name === patient.patient_name),
  );
}

export function buildBpTrendData(readings: VitalReading[], limit = 20) {
  const sorted = readings
    .filter((r) => r.metric === "bp_sys" || r.metric === "bp_dia")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-limit * 2);
  const buckets: Record<string, { time: string; sys?: number; dia?: number }> = {};
  for (const r of sorted) {
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

export function buildSingleVitalTrend(readings: VitalReading[], metrics: string[], limit = 24) {
  return readings
    .filter((r) => metrics.includes(r.metric))
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-limit)
    .map((r) => ({
      time: new Date(r.recorded_at).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: Number(r.value),
    }));
}

export function vitalsHubStats(
  roster: VitalsPatientRow[],
  readings: VitalReading[],
  range: RpmTimeRange,
  abnormalCount: number,
) {
  const scoped = filterVitalsByRange(readings, range);
  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const recent24 = readings.filter((r) => new Date(r.recorded_at).getTime() > since24h);
  return {
    monitored: roster.length,
    withDeviceData: roster.filter((p) => p.hasDeviceData).length,
    intakeOnly: roster.filter((p) => p.intake && !p.hasDeviceData).length,
    critical: scoped.filter((r) => r.flagged).length,
    readingsInRange: scoped.length,
    readings24h: recent24.length,
    abnormalSelected: abnormalCount,
  };
}

export function timeAgoVitals(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}
